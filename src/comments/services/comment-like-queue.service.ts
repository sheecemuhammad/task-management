import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';

import Redis from 'ioredis';

@Injectable()
export class CommentLikeQueueService
  implements OnModuleDestroy
{
  private readonly redis: Redis;

  private readonly streamName =
    process.env.COMMENT_LIKE_STREAM_NAME ||
    'comment-like-events';

  private readonly stateKeyPrefix =
    'comment-like-state:';

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });

    this.redis.on('connect', () => {
      console.log(
        'Comment Like Redis connected successfully',
      );
    });

    this.redis.on('error', (error) => {
      console.error(
        'Comment Like Redis connection error:',
        error,
      );
    });
  }

  // =====================================================
  // Add Like / Unlike Event
  // =====================================================

  async addLikeEvent(
    commentId: string,
    userId: string,
    liked: boolean,
  ): Promise<string> {
    /*
     * First add the event to the Redis Stream.
     *
     * The Stream is the durable queue that the consumer
     * will eventually persist into PostgreSQL.
     */
    const messageId = await this.redis.xadd(
      this.streamName,
      '*',
      'commentId',
      commentId,
      'userId',
      userId,
      'liked',
      String(liked),
      'timestamp',
      new Date().toISOString(),
    );

    if (!messageId) {
      throw new Error(
        'Failed to add comment like event to Redis Stream',
      );
    }

    /*
     * Keep only the latest state for this
     * comment + user combination.
     *
     * Example:
     *
     * true
     * false
     * true
     *
     * Redis Hash ultimately contains:
     *
     * userId -> true
     */
    await this.setLatestLikeState(
      commentId,
      userId,
      liked,
    );

    return messageId;
  }

  // =====================================================
  // Get State Key
  // =====================================================

  private getStateKey(
    commentId: string,
  ): string {
    return `${this.stateKeyPrefix}${commentId}`;
  }

  // =====================================================
  // Set Latest Like State
  // =====================================================

  async setLatestLikeState(
    commentId: string,
    userId: string,
    liked: boolean,
  ): Promise<void> {
    const key = this.getStateKey(commentId);

    await this.redis.hset(
      key,
      userId,
      String(liked),
    );
  }

  // =====================================================
  // Get Latest State For User
  // =====================================================

  async getLatestLikeState(
    commentId: string,
    userId: string,
  ): Promise<boolean | null> {
    const key = this.getStateKey(commentId);

    const value = await this.redis.hget(
      key,
      userId,
    );

    if (value === null) {
      return null;
    }

    return value === 'true';
  }

  // =====================================================
  // Get All Latest States
  // =====================================================

  async getLatestLikeStates(
    commentId: string,
  ): Promise<Record<string, boolean>> {
    const key = this.getStateKey(commentId);

    const states = await this.redis.hgetall(key);

    const result: Record<string, boolean> = {};

    for (const [
      userId,
      value,
    ] of Object.entries(states)) {
      result[userId] = value === 'true';
    }

    return result;
  }

  // =====================================================
  // Remove Latest State
  // =====================================================

  async removeLatestLikeState(
    commentId: string,
    userId: string,
  ): Promise<void> {
    const key = this.getStateKey(commentId);

    await this.redis.hdel(
      key,
      userId,
    );
  }

  // =====================================================
  // Remove State Only If It Matches
  // =====================================================

  async removeLatestLikeStateIfMatches(
    commentId: string,
    userId: string,
    expectedState: boolean,
  ): Promise<boolean> {
    const key = this.getStateKey(commentId);

    const currentValue =
      await this.redis.hget(
        key,
        userId,
      );

    if (currentValue === null) {
      return false;
    }

    const currentState =
      currentValue === 'true';

    /*
     * Only remove the state if it is still the
     * same state that was persisted.
     *
     * This protects us from:
     *
     * Batch:
     *   userA -> true
     *
     * New request arrives:
     *   userA -> false
     *
     * Consumer finishes old batch:
     *   DO NOT delete false.
     */
    if (currentState !== expectedState) {
      return false;
    }

    await this.redis.hdel(
      key,
      userId,
    );

    return true;
  }

  // =====================================================
  // Destroy
  // =====================================================

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}