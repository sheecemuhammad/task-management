import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CommentLikesRepository } from '../repositories/comment-likes.repository';
import { CommentsRepository } from '../repositories/comments.repository';

import { RealtimeService } from '../../common/realtime/realtime.service';
import { REALTIME_EVENTS } from '../../common/realtime-contract/events';
import { taskRoom } from '../../common/realtime-contract/room-helpers';

@Injectable()
export class CommentLikesService {
  constructor(
    private readonly commentLikesRepository: CommentLikesRepository,
    private readonly commentsRepository: CommentsRepository,
    private readonly realtimeService: RealtimeService,
  ) {}

  async toggleLike(
    teamId: string,
    groupId: string,
    taskId: string,
    commentId: string,
    userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException(
        'User ID is required',
      );
    }

    // Verify that the comment belongs to the
    // requested team's task group.
    const comment =
      await this.commentsRepository.findCommentInTeam(
        commentId,
        taskId,
        groupId,
        teamId,
      );

    if (!comment) {
      throw new NotFoundException(
        'Comment not found',
      );
    }

    // Check whether this user has already
    // liked the comment.
    const existingLike =
      await this.commentLikesRepository.findByCommentAndUser(
        commentId,
        userId,
      );

    let liked: boolean;

    if (existingLike) {
      // Already liked → remove the like.
      await this.commentLikesRepository.delete(
        commentId,
        userId,
      );

      liked = false;
    } else {
      // Not liked → create the like.
      await this.commentLikesRepository.create(
        commentId,
        userId,
      );

      liked = true;
    }

    // Get the latest total like count.
    const likeCount =
      await this.commentLikesRepository.countByComment(
        commentId,
      );

    // Select the appropriate realtime event.
    const event = liked
      ? REALTIME_EVENTS.COMMENT_LIKED
      : REALTIME_EVENTS.COMMENT_UNLIKED;

    // Broadcast the change to everyone
    // connected to this task room.
    await this.realtimeService.emitToRoom(
      taskRoom(comment.taskId),
      event,
      {
        commentId,
        userId,
        liked,
        likeCount,
      },
    );

    return {
      commentId,
      liked,
      likeCount,
    };
  }
}