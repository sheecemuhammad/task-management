import { Module } from '@nestjs/common';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { TeamsModule } from '../teams/teams.module';
import { PrismaService } from '../prisma/prisma.service';

import { AttachmentsController } from './controllers/attachments.controller';
import { AttachmentsService } from './services/attachments.service';
import { AttachmentsRepository } from './repositories/attachments.repository';

@Module({
  imports: [CloudinaryModule, TeamsModule],
  controllers: [AttachmentsController],
  providers: [PrismaService, AttachmentsService, AttachmentsRepository],
})
export class AttachmentsModule {}
