import { Module } from '@nestjs/common';

import { CommentsController } from './controllers/comments.controller';
import { CommentsRepository } from './repositories/comments.repository';
import { CommentsService } from './services/comments.service';
import { CommentLikesRepository } from './repositories/comment-likes.repository';
import { CommentLikesService } from './services/comment-likes.service';

import { PrismaService } from '../prisma/prisma.service';
import { TeamsModule } from '../teams/teams.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TeamsModule, AuthModule],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    CommentsRepository,
    CommentLikesRepository,
    CommentLikesService,
    PrismaService,
  ],
})
export class CommentsModule {}
