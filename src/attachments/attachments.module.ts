import { Module } from '@nestjs/common';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { TeamsModule } from '../teams/teams.module';

import { AttachmentsController } from './controllers/attachments.controller';
import { AttachmentsService } from './services/attachments.service';
import { AttachmentsRepository } from './repositories/attachments.repository';
import { RealtimeModule } from '../common/realtime/realtime.module';

@Module({
  imports: [CloudinaryModule, TeamsModule, RealtimeModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, AttachmentsRepository],
})
export class AttachmentsModule {}
