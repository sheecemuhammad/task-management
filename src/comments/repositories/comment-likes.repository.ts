import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

export interface CommentLikeBatchItem {
  commentId: string;
  userId: string;
}

@Injectable()
export class CommentLikesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // Find Like
  // =====================================================

  async findByCommentAndUser(commentId: string, userId: string) {
    return this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });
  }

  // =====================================================
  // Create Single Like
  // =====================================================

  async create(commentId: string, userId: string) {
    return this.prisma.commentLike.create({
      data: {
        commentId,
        userId,
      },
    });
  }

  // =====================================================
  // Delete Single Like
  // =====================================================

  async delete(commentId: string, userId: string) {
    return this.prisma.commentLike.delete({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });
  }

  // =====================================================
  // Count Likes
  // =====================================================

  async countByComment(commentId: string): Promise<number> {
    return this.prisma.commentLike.count({
      where: {
        commentId,
      },
    });
  }

  // =====================================================
  // Batch Create Likes
  // =====================================================

  async createMany(likes: CommentLikeBatchItem[]): Promise<void> {
    if (likes.length === 0) {
      return;
    }

    await this.prisma.commentLike.createMany({
      data: likes,
      skipDuplicates: true,
    });
  }

  // =====================================================
  // Batch Delete Likes
  // =====================================================

  async deleteMany(likes: CommentLikeBatchItem[]): Promise<void> {
    if (likes.length === 0) {
      return;
    }

    await this.prisma.commentLike.deleteMany({
      where: {
        OR: likes.map((like) => ({
          commentId: like.commentId,
          userId: like.userId,
        })),
      },
    });
  }

  // =====================================================
  // Find Existing Likes For Multiple Users
  // =====================================================

  async findExistingLikesForUsers(
    commentId: string,
    userIds: string[],
  ): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }

    const likes = await this.prisma.commentLike.findMany({
      where: {
        commentId,
        userId: {
          in: userIds,
        },
      },
      select: {
        userId: true,
      },
    });

    return likes.map((like) => like.userId);
  }
}
