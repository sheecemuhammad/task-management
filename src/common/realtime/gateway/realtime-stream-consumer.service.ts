import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

import { RealtimeStreamMessage } from '../../realtime-contract/stream-message';
import { userRoom } from '../../realtime-contract/room-helpers';

import { RealtimeSocketGatewayService } from './realtime-socket-gateway.service';

@Injectable()
export class RealtimeStreamConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    RealtimeStreamConsumerService.name,
  );

  private readonly streamName =
    process.env.REALTIME_STREAM_NAME ||
    'task-management-events';

  private readonly consumerGroup =
    process.env.REALTIME_CONSUMER_GROUP ||
    'task-management-group';

  private readonly consumerName =
    `consumer-${process.pid}`;

  private readonly redis: Redis;

  private isRunning = true;

  constructor(
    private readonly gateway: RealtimeSocketGatewayService,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });

    this.redis.on('error', (error) => {
      this.logger.error(
        'Realtime stream Redis connection error',
        error,
      );
    });
  }

  async onModuleInit(): Promise<void> {
    await this.createConsumerGroup();

    void this.consume();
  }

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
        `Realtime consumer group "${this.consumerGroup}" created`,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('BUSYGROUP')
      ) {
        this.logger.log(
          `Realtime consumer group "${this.consumerGroup}" already exists`,
        );

        return;
      }

      throw error;
    }
  }

  private async consume(): Promise<void> {
    while (this.isRunning) {
      try {
        const result = await this.redis.xreadgroup(
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
            if (fields) {
              await this.processMessage(
                messageId,
                fields,
              );
            }
          }
        }
      } catch (error) {
        if (!this.isRunning) {
          break;
        }

        this.logger.error(
          'Realtime stream consumer error',
          error instanceof Error
            ? error.stack
            : String(error),
        );
      }
    }
  }

  private async processMessage(
    messageId: string,
    fields: string[],
  ): Promise<void> {
    try {
      const message = this.parseMessage(fields);

      if (!message) {
        this.logger.warn(
          `Invalid realtime stream message: ${messageId}`,
        );

        await this.acknowledge(messageId);

        return;
      }

      const socketServer = this.gateway.getServer();

      if (!socketServer) {
        this.logger.warn(
          'Socket.IO server is not initialized yet',
        );

        return;
      }

      const payload = JSON.parse(message.payload);

      if (message.targetType === 'room') {
        socketServer
          .to(message.targetId)
          .emit(message.event, payload);
      } else {
        socketServer
          .to(userRoom(message.targetId))
          .emit(message.event, payload);
      }

      this.logger.log(
        `Realtime event "${message.event}" emitted to ${message.targetType}:${message.targetId}`,
      );

      await this.acknowledge(messageId);
    } catch (error) {
      this.logger.error(
        `Failed to process realtime message: ${messageId}`,
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  private parseMessage(
    fields: string[],
  ): RealtimeStreamMessage | null {
    const data: Record<string, string> = {};

    for (
      let index = 0;
      index < fields.length;
      index += 2
    ) {
      const key = fields[index];
      const value = fields[index + 1];

      if (key && value !== undefined) {
        data[key] = value;
      }
    }

    if (
      !data.targetType ||
      !data.targetId ||
      !data.event ||
      !data.payload ||
      !data.timestamp
    ) {
      return null;
    }

    if (
      data.targetType !== 'room' &&
      data.targetType !== 'user'
    ) {
      return null;
    }

    return {
      targetType: data.targetType,
      targetId: data.targetId,
      event:
        data.event as RealtimeStreamMessage['event'],
      payload: data.payload,
      timestamp: data.timestamp,
    };
  }

  private async acknowledge(
    messageId: string,
  ): Promise<void> {
    await this.redis.xack(
      this.streamName,
      this.consumerGroup,
      messageId,
    );

    this.logger.debug(
      `Realtime stream event acknowledged: ${messageId}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.isRunning = false;

    await this.redis.quit();
  }
}