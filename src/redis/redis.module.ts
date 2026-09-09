import { Global, Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { RedisStreamService } from './streams/services/redis-stream.service';
import { RedisStreamConsumer } from './streams/consumers/redis-stream.consumer';

@Global()
@Module({
  providers: [RedisService, RedisStreamService, RedisStreamConsumer],
  exports: [RedisService, RedisStreamService],
})
export class RedisModule {}
