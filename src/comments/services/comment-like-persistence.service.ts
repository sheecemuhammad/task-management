import { Injectable, Logger } from '@nestjs/common';

import { CommentLikesRepository } from '../repositories/comment-likes.repository';

interface CommentLikeEvent {
  commentId: string;
  userId: string;
  liked: boolean;
}

@Injectable()
export class CommentLikePersistenceService {
  private readonly logger = new Logger(CommentLikePersistenceService.name);

  constructor(
    private readonly commentLikesRepository: CommentLikesRepository,
  ) {}

  // =====================================================
  // Process Batch
  // =====================================================

  async processBatch(events: CommentLikeEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    // ===================================================
    // Keep Only Latest State
    // ===================================================

    /*
     * Multiple events may exist for the same:
     *
     * commentId + userId
     *
     * Example:
     *
     * LIKE
     * UNLIKE
     * LIKE
     * UNLIKE
     * LIKE
     *
     * We only need the final state.
     */

    const latestStates = new Map<string, CommentLikeEvent>();

    for (const event of events) {
      const key = `${event.commentId}:${event.userId}`;

      latestStates.set(key, event);
    }

    const finalEvents = Array.from(latestStates.values());

    // ===================================================
    // Separate Likes and Unlikes
    // ===================================================

    const likes = finalEvents.filter((event) => event.liked);

    const unlikes = finalEvents.filter((event) => !event.liked);

    // ===================================================
    // Persist Likes
    // ===================================================

    if (likes.length > 0) {
      await this.commentLikesRepository.createMany(
        likes.map((event) => ({
          commentId: event.commentId,
          userId: event.userId,
        })),
      );
    }

    // ===================================================
    // Persist Unlikes
    // ===================================================

    if (unlikes.length > 0) {
      await this.commentLikesRepository.deleteMany(
        unlikes.map((event) => ({
          commentId: event.commentId,
          userId: event.userId,
        })),
      );
    }

    // ===================================================
    // Logging
    // ===================================================

    this.logger.log(
      `Processed comment like batch: ` +
        `${events.length} events → ` +
        `${finalEvents.length} final states → ` +
        `${likes.length} likes, ` +
        `${unlikes.length} unlikes`,
    );
  }
}
