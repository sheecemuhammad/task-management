import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CommentLikesRepository } from '../repositories/comment-likes.repository';
import { CommentsRepository } from '../repositories/comments.repository';
import { CommentLikeQueueService } from './comment-like-queue.service';

import { RealtimeService } from '../../common/realtime/realtime.service';
import { REALTIME_EVENTS } from '../../common/realtime-contract/events';
import { taskRoom } from '../../common/realtime-contract/room-helpers';

@Injectable()
export class CommentLikesService {
  constructor(
    private readonly commentLikesRepository: CommentLikesRepository,
    private readonly commentsRepository: CommentsRepository,
    private readonly commentLikeQueueService: CommentLikeQueueService,
    private readonly realtimeService: RealtimeService,
  ) {}

  // =====================================================
  // Toggle Like
  // =====================================================

  async toggleLike(
    teamId: string,
    groupId: string,
    taskId: string,
    commentId: string,
    userId: string,
  ) {
    // ===================================================
    // Validate User
    // ===================================================

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // ===================================================
    // Verify Comment
    // ===================================================

    const comment = await this.commentsRepository.findCommentInTeam(
      commentId,
      taskId,
      groupId,
      teamId,
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // ===================================================
    // Determine Current User Like State
    // ===================================================

    /*
     * Redis latest-state is checked first.
     *
     * This is important because PostgreSQL persistence
     * happens asynchronously.
     *
     * Example:
     *
     * PostgreSQL = unliked
     * Redis      = liked
     *
     * In this situation the user is already considered
     * liked, so the next toggle should become UNLIKE.
     */

    const latestRedisState =
      await this.commentLikeQueueService.getLatestLikeState(commentId, userId);

    let currentLiked: boolean;

    if (latestRedisState !== null) {
      currentLiked = latestRedisState;
    } else {
      const existingLike =
        await this.commentLikesRepository.findByCommentAndUser(
          commentId,
          userId,
        );

      currentLiked = !!existingLike;
    }

    // ===================================================
    // Toggle
    // ===================================================

    const liked = !currentLiked;

    // ===================================================
    // Queue Event
    // ===================================================

    /*
     * addLikeEvent() performs two operations:
     *
     * 1. Adds the event to Redis Stream.
     * 2. Updates the Redis latest-state Hash.
     */

    await this.commentLikeQueueService.addLikeEvent(commentId, userId, liked);

    // ===================================================
    // Calculate Like Count
    // ===================================================

    /*
     * PostgreSQL contains persisted likes.
     *
     * Redis may contain newer states which have not yet
     * reached PostgreSQL.
     *
     * Therefore we start with the database count and
     * reconcile every Redis state against the database.
     */

    let likeCount = await this.commentLikesRepository.countByComment(commentId);

    const redisStates =
      await this.commentLikeQueueService.getLatestLikeStates(commentId);

    /*
     * Redis contains the latest state for users who have
     * interacted with this comment through the new
     * like/unlike flow.
     *
     * We compare each Redis state with PostgreSQL.
     */

    for (const [redisUserId, redisLiked] of Object.entries(redisStates)) {
      const databaseLike =
        await this.commentLikesRepository.findByCommentAndUser(
          commentId,
          redisUserId,
        );

      const databaseLiked = !!databaseLike;

      /*
       * DB = false
       * Redis = true
       *
       * This like has not been persisted yet.
       */
      if (!databaseLiked && redisLiked) {
        likeCount += 1;
      }

      /*
       * DB = true
       * Redis = false
       *
       * This unlike has not been persisted yet.
       */
      if (databaseLiked && !redisLiked) {
        likeCount -= 1;
      }
    }

    // ===================================================
    // Protect Against Negative Count
    // ===================================================

    if (likeCount < 0) {
      likeCount = 0;
    }

    // ===================================================
    // Realtime Event
    // ===================================================

    const event = liked
      ? REALTIME_EVENTS.COMMENT_LIKED
      : REALTIME_EVENTS.COMMENT_UNLIKED;

    await this.realtimeService.emitToRoom(taskRoom(comment.taskId), event, {
      commentId,
      userId,
      liked,
      likeCount,
    });

    // ===================================================
    // Response
    // ===================================================

    return {
      commentId,
      liked,
      likeCount,
    };
  }
}
