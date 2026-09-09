import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { RedisService } from '../../services/redis.service';

@Injectable()
export class RedisStreamConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisStreamConsumer.name);

  private readonly streamName = 'task-management-events';
  private readonly consumerGroup = 'task-management-group';
  private readonly consumerName = `consumer-${process.pid}`;

  private isRunning = true;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit(): Promise<void> {
    await this.createConsumerGroup();

    // Start consuming without blocking NestJS startup
    void this.consume();
  }

  private async createConsumerGroup(): Promise<void> {
    const redis = this.redisService.getClient();

    try {
      await redis.xgroup(
        'CREATE',
        this.streamName,
        this.consumerGroup,
        '0',
        'MKSTREAM',
      );

      this.logger.log(
        `Redis consumer group "${this.consumerGroup}" created`,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('BUSYGROUP')
      ) {
        this.logger.log(
          `Redis consumer group "${this.consumerGroup}" already exists`,
        );

        return;
      }

      throw error;
    }
  }

  private async consume(): Promise<void> {
    const redis = this.redisService.getStreamClient();

    while (this.isRunning) {
      try {
        const result = await redis.xreadgroup(
          'GROUP',
          this.consumerGroup,
          this.consumerName,
          'COUNT',
          10,
          'BLOCK',
          5000,
          'STREAMS',
          this.streamName,
          '>',
        );

        if (!result) {
          continue;
        }

        for (const [, messages] of result) {
          for (const [messageId, fields] of messages) {
            this.logger.log(
              `Received Redis stream event: ${messageId}`,
            );

            this.logger.debug(
              `Event data: ${JSON.stringify(fields)}`,
            );

            await redis.xack(
              this.streamName,
              this.consumerGroup,
              messageId,
            );

            this.logger.log(
              `Redis stream event acknowledged: ${messageId}`,
            );
          }
        }
      } catch (error) {
        if (!this.isRunning) {
          break;
        }

        this.logger.error(
          'Redis stream consumer error',
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.isRunning = false;
  }
}