import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly streamRedis: Redis;

  constructor() {
    const options = {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    };

    // Normal Redis connection
    this.redis = new Redis(options);

    // Dedicated connection for blocking Redis Stream operations
    this.streamRedis = new Redis(options);

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.streamRedis.on('error', (error) => {
      console.error('Redis stream connection error:', error);
    });
  }

  getClient(): Redis {
    return this.redis;
  }

  getStreamClient(): Redis {
    return this.streamRedis;
  }

  async ping(): Promise<string> {
    return this.redis.ping();
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      this.redis.quit(),
      this.streamRedis.quit(),
    ]);
  }
}