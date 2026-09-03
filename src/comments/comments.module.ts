import { Module } from '@nestjs/common';
import { CommentsController } from './controllers/comments.controller';
import { CommentsRepository } from './repositories/comments.repository';
import { CommentsService } from './services/comments.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [TeamsModule],

  controllers: [CommentsController],

  providers: [
    CommentsService,
    CommentsRepository,
    PrismaService,
  ],
})
export class CommentsModule {}