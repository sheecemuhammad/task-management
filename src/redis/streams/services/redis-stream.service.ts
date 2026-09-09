import { Injectable } from '@nestjs/common';
import { RedisService } from '../../services/redis.service';

@Injectable()
export class RedisStreamService {
  constructor(private readonly redisService: RedisService) {}

  async addEvent(
    streamName: string,
    event: Record<string, string>,
  ): Promise<string> {
    const redis = this.redisService.getClient();

    const fields: string[] = [];

    for (const [key, value] of Object.entries(event)) {
      fields.push(key, value);
    }

    const messageId = await redis.xadd(streamName, '*', ...fields);

    if (!messageId) {
      throw new Error('Failed to add event to Redis stream');
    }

    return messageId;
  }
}