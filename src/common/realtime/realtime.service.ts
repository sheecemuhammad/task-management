import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { RealtimeEvent } from '../realtime-contract/events';

import { RealtimeStreamMessage } from '../realtime-contract/stream-message';
import { createRedisClient } from '../redis/create-redis-client';

@Injectable()
export class RealtimeService implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimeService.name);

  private readonly redis: Redis;

  private readonly streamName =
    process.env.REALTIME_STREAM_NAME || 'task-management-events';

  constructor() {
    this.redis = createRedisClient();

    this.redis.on('connect', () => {
      this.logger.log('Realtime Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Realtime Redis connection error', error);
    });
  }

  async emitToRoom(
    roomId: string,
    event: RealtimeEvent,
    payload: unknown,
  ): Promise<string> {
    return this.addToStream({
      targetType: 'room',
      targetId: roomId,
      event,
      payload,
    });
  }

  async emitToUser(
    userId: string,
    event: RealtimeEvent,
    payload: unknown,
  ): Promise<string> {
    return this.addToStream({
      targetType: 'user',
      targetId: userId,
      event,
      payload,
    });
  }

  private async addToStream(data: {
    targetType: 'user' | 'room';
    targetId: string;
    event: RealtimeEvent;
    payload: unknown;
  }): Promise<string> {
    const message: RealtimeStreamMessage = {
      targetType: data.targetType,
      targetId: data.targetId,
      event: data.event,
      payload: JSON.stringify(data.payload),
      timestamp: new Date().toISOString(),
    };

    const messageId = await this.redis.xadd(
      this.streamName,
      '*',
      'targetType',
      message.targetType,
      'targetId',
      message.targetId,
      'event',
      message.event,
      'payload',
      message.payload,
      'timestamp',
      message.timestamp,
    );

    if (!messageId) {
      throw new Error('Failed to add realtime event to Redis Stream');
    }

    return messageId;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
