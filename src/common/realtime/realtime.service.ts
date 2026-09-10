import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import {
  RealtimeEvent,
  REALTIME_EVENTS,
} from '../realtime-contract/events';
import { RealtimeStreamMessage } from '../realtime-contract/stream-message';

@Injectable()
export class RealtimeService {
  private readonly redis: Redis;

  private readonly streamName =
    process.env.REALTIME_STREAM_NAME || 'task-management-events';

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });

    this.redis.on('connect', () => {
      console.log('Realtime Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      console.error('Realtime Redis connection error:', error);
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