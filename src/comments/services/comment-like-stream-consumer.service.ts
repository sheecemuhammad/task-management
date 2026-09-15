import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import Redis from 'ioredis';

import { CommentLikePersistenceService } from './comment-like-persistence.service';
import { CommentLikeQueueService } from './comment-like-queue.service';

interface CommentLikeEvent {
  commentId: string;
  userId: string;
  liked: boolean;
  timestamp?: string;
}

interface PendingMessage {
  messageId: string;
  event: CommentLikeEvent;
}

@Injectable()
export class CommentLikeStreamConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    CommentLikeStreamConsumerService.name,
  );

  private readonly streamName =
    process.env.COMMENT_LIKE_STREAM_NAME ||
    'comment-like-events';

  private readonly consumerGroup =
    process.env.COMMENT_LIKE_CONSUMER_GROUP ||
    'comment-like-group';

  private readonly consumerName =
    `comment-like-consumer-${process.pid}`;

  private readonly redis: Redis;

  /**
   * Wait 1 second before persisting a batch
   * if the maximum batch size has not been reached.
   */
  private readonly batchWindowMs = 1000;

  /**
   * Maximum number of events persisted in one batch.
   */
  private readonly maxBatchSize = 100;

  /**
   * Number of pending messages to recover
   * when the application starts.
   */
  private readonly pendingRecoveryBatchSize = 100;

  private isRunning = true;

  private pendingMessages: PendingMessage[] = [];

  private batchTimer: NodeJS.Timeout | null = null;

  private isProcessingBatch = false;

  constructor(
    private readonly persistenceService: CommentLikePersistenceService,
    private readonly queueService: CommentLikeQueueService,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });

    this.redis.on('connect', () => {
      this.logger.log(
        'Comment Like Redis consumer connected',
      );
    });

    this.redis.on('error', (error) => {
      this.logger.error(
        'Comment Like Redis consumer connection error',
        error,
      );
    });
  }

  // =====================================================
  // Module Init
  // =====================================================

  async onModuleInit(): Promise<void> {
    await this.createConsumerGroup();

    /*
     * Recover messages that were already delivered to
     * the consumer group but were never acknowledged.
     */
    await this.recoverPendingMessages();

    /*
     * Start consuming new messages.
     */
    void this.consume();
  }

  // =====================================================
  // Create Consumer Group
  // =====================================================

  private async createConsumerGroup(): Promise<void> {
    try {
      await this.redis.xgroup(
        'CREATE',
        this.streamName,
        this.consumerGroup,
        '0',
        'MKSTREAM',
      );

      this.logger.log(
        `Comment Like consumer group "${this.consumerGroup}" created`,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('BUSYGROUP')
      ) {
        this.logger.log(
          `Comment Like consumer group "${this.consumerGroup}" already exists`,
        );

        return;
      }

      throw error;
    }
  }

  // =====================================================
  // Recover Pending Messages
  // =====================================================

  private async recoverPendingMessages(): Promise<void> {
    try {
      /*
       * "0" reads pending messages that belong to
       * this consumer.
       *
       * These are messages that were previously delivered
       * but were never acknowledged.
       */
      const result = await this.redis.xreadgroup(
        'GROUP',
        this.consumerGroup,
        this.consumerName,
        'COUNT',
        this.pendingRecoveryBatchSize,
        'STREAMS',
        this.streamName,
        '0',
      );

      if (!result) {
        return;
      }

      let recoveredCount = 0;

      for (const [, messages] of result) {
        if (!messages || messages.length === 0) {
          continue;
        }

        for (const [messageId, fields] of messages) {
          if (!fields) {
            continue;
          }

          const event = this.parseMessage(fields);

          if (!event) {
            this.logger.warn(
              `Invalid pending comment like event: ${messageId}`,
            );

            await this.acknowledge(messageId);

            continue;
          }

          this.pendingMessages.push({
            messageId,
            event,
          });

          recoveredCount++;
        }
      }

      if (recoveredCount === 0) {
        return;
      }

      this.logger.log(
        `Recovered ${recoveredCount} pending comment like messages`,
      );

      /*
       * If recovery already filled a complete batch,
       * persist immediately.
       */
      if (
        this.pendingMessages.length >=
        this.maxBatchSize
      ) {
        await this.flushBatch();
      } else {
        /*
         * Otherwise wait for the normal batch window.
         */
        this.startBatchTimer();
      }
    } catch (error) {
      this.logger.error(
        'Failed to recover pending comment like messages',
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  // =====================================================
  // Consume New Messages
  // =====================================================

  private async consume(): Promise<void> {
    while (this.isRunning) {
      try {
        const result = await this.redis.xreadgroup(
          'GROUP',
          this.consumerGroup,
          this.consumerName,
          'COUNT',
          this.maxBatchSize,
          'BLOCK',
          1000,
          'STREAMS',
          this.streamName,
          '>',
        );

        if (!result) {
          continue;
        }

        for (const [, messages] of result) {
          if (!messages || messages.length === 0) {
            continue;
          }

          for (const [messageId, fields] of messages) {
            if (!fields) {
              continue;
            }

            const event = this.parseMessage(fields);

            if (!event) {
              this.logger.warn(
                `Invalid comment like event: ${messageId}`,
              );

              await this.acknowledge(messageId);

              continue;
            }

            this.pendingMessages.push({
              messageId,
              event,
            });
          }
        }

        /*
         * Persist immediately if maximum batch size
         * has been reached.
         */
        if (
          this.pendingMessages.length >=
          this.maxBatchSize
        ) {
          await this.flushBatch();
        } else {
          /*
           * Otherwise start the 1-second batch timer.
           */
          this.startBatchTimer();
        }
      } catch (error) {
        if (!this.isRunning) {
          break;
        }

        this.logger.error(
          'Comment like stream consumer error',
          error instanceof Error
            ? error.stack
            : String(error),
        );
      }
    }
  }

  // =====================================================
  // Start Batch Timer
  // =====================================================

  private startBatchTimer(): void {
    /*
     * Don't create multiple timers.
     */
    if (this.batchTimer) {
      return;
    }

    this.batchTimer = setTimeout(() => {
      this.batchTimer = null;

      void this.flushBatch();
    }, this.batchWindowMs);
  }

  // =====================================================
  // Flush Batch
  // =====================================================

  private async flushBatch(): Promise<void> {
    /*
     * Don't process another batch while one is already
     * being persisted.
     */
    if (
      this.isProcessingBatch ||
      this.pendingMessages.length === 0
    ) {
      return;
    }

    this.isProcessingBatch = true;

    /*
     * Take up to 100 messages from the queue.
     */
    const batch = this.pendingMessages.splice(
      0,
      this.maxBatchSize,
    );

    try {
      // -------------------------------------------------
      // Persist Batch
      // -------------------------------------------------

      await this.persistenceService.processBatch(
        batch.map((message) => message.event),
      );

      // -------------------------------------------------
      // Acknowledge Stream Messages
      // -------------------------------------------------

      for (const message of batch) {
        await this.acknowledge(
          message.messageId,
        );
      }

      // -------------------------------------------------
      // Cleanup Redis Latest States
      // -------------------------------------------------

      await this.cleanupPersistedStates(batch);

      this.logger.log(
        `Comment like batch persisted: ${batch.length} events`,
      );
    } catch (error) {
      /*
       * If DB persistence fails, put the messages back
       * into the local queue so they can be retried.
       */
      this.pendingMessages.unshift(...batch);

      this.logger.error(
        'Failed to persist comment like batch',
        error instanceof Error
          ? error.stack
          : String(error),
      );
    } finally {
      this.isProcessingBatch = false;

      /*
       * If more messages are waiting, start another
       * batch timer.
       */
      if (this.pendingMessages.length > 0) {
        this.startBatchTimer();
      }
    }
  }

  // =====================================================
  // Cleanup Persisted Redis States
  // =====================================================

  private async cleanupPersistedStates(
    batch: PendingMessage[],
  ): Promise<void> {
    /*
     * Group the final state of every
     * comment + user combination.
     *
     * Example:
     *
     * userA -> true
     * userA -> false
     * userA -> true
     *
     * Only the latest state is kept.
     */
    const statesByComment = new Map<
      string,
      Map<string, boolean>
    >();

    for (const message of batch) {
      if (
        !statesByComment.has(
          message.event.commentId,
        )
      ) {
        statesByComment.set(
          message.event.commentId,
          new Map<string, boolean>(),
        );
      }

      statesByComment
        .get(message.event.commentId)!
        .set(
          message.event.userId,
          message.event.liked,
        );
    }

    /*
     * Ask CommentLikeQueueService to remove the Redis
     * state only if it still matches the state we just
     * persisted.
     */
    for (const [
      commentId,
      userStates,
    ] of statesByComment.entries()) {
      for (const [
        userId,
        persistedState,
      ] of userStates.entries()) {
        await this.queueService
          .removeLatestLikeStateIfMatches(
            commentId,
            userId,
            persistedState,
          );
      }
    }
  }

  // =====================================================
  // Parse Redis Stream Message
  // =====================================================

  private parseMessage(
    fields: string[],
  ): CommentLikeEvent | null {
    const data: Record<string, string> = {};

    for (
      let index = 0;
      index < fields.length;
      index += 2
    ) {
      const key = fields[index];
      const value = fields[index + 1];

      if (
        key &&
        value !== undefined
      ) {
        data[key] = value;
      }
    }

    if (
      !data.commentId ||
      !data.userId ||
      data.liked === undefined
    ) {
      return null;
    }

    return {
      commentId: data.commentId,
      userId: data.userId,
      liked: data.liked === 'true',
      timestamp: data.timestamp,
    };
  }

  // =====================================================
  // Acknowledge Message
  // =====================================================

  private async acknowledge(
    messageId: string,
  ): Promise<void> {
    await this.redis.xack(
      this.streamName,
      this.consumerGroup,
      messageId,
    );
  }

  // =====================================================
  // Module Destroy
  // =====================================================

  async onModuleDestroy(): Promise<void> {
    this.isRunning = false;

    /*
     * Stop the timer.
     */
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    /*
     * Try to persist anything still waiting before
     * shutting down.
     */
    if (this.pendingMessages.length > 0) {
      await this.flushBatch();
    }

    await this.redis.quit();
  }
}