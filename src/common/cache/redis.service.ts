import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';

import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(
    RedisService.name,
  );

  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    });

    this.redis.on('connect', () => {
      this.logger.log('Cache Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error(
        'Cache Redis connection error',
        error,
      );
    });
  }

  getClient(): Redis {
    return this.redis;
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<void> {
    if (ttlSeconds) {
      await this.redis.set(
        key,
        value,
        'EX',
        ttlSeconds,
      );

      return;
    }

    await this.redis.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}