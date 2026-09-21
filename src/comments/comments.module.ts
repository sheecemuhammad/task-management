import { Module } from '@nestjs/common';

import { CommentsController } from './controllers/comments.controller';
import { CommentsRepository } from './repositories/comments.repository';
import { CommentsService } from './services/comments.service';
import { CommentLikesRepository } from './repositories/comment-likes.repository';
import { CommentLikesService } from './services/comment-likes.service';
import { CommentLikeQueueService } from './services/comment-like-queue.service';
import { CommentLikePersistenceService } from './services/comment-like-persistence.service';
import { CommentLikeStreamConsumerService } from './services/comment-like-stream-consumer.service';

import { TeamsModule } from '../teams/teams.module';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../common/realtime/realtime.module';

@Module({
  imports: [TeamsModule, AuthModule, RealtimeModule],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    CommentsRepository,
    CommentLikesRepository,
    CommentLikesService,
    CommentLikeQueueService,
    CommentLikePersistenceService,
    CommentLikeStreamConsumerService,
  ],
})
export class CommentsModule {}
