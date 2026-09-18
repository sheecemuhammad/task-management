import { Module } from '@nestjs/common';

import { RealtimeService } from './realtime.service';
import { RealtimeGatewayModule } from './gateway/realtime-gateway.module';

@Module({
  imports: [RealtimeGatewayModule],
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
