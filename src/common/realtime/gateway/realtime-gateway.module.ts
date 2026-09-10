import { Global, Module } from '@nestjs/common';

import { AuthModule } from '../../../auth/auth.module';

import { RealtimeSocketGatewayService } from './realtime-socket-gateway.service';
import { RealtimeStreamConsumerService } from './realtime-stream-consumer.service';
import { JoinRoomPolicy } from './join-room-policy';

@Global()
@Module({
  imports: [AuthModule],
  providers: [
    RealtimeSocketGatewayService,
    RealtimeStreamConsumerService,
    JoinRoomPolicy,
  ],
  exports: [RealtimeSocketGatewayService, JoinRoomPolicy],
})
export class RealtimeGatewayModule {}
