import Redis, { RedisOptions } from 'ioredis';

export function createRedisClientOptions(
  overrides: RedisOptions = {},
): RedisOptions {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    ...overrides,
  };
}

export function createRedisClient(overrides: RedisOptions = {}): Redis {
  return new Redis(createRedisClientOptions(overrides));
}
