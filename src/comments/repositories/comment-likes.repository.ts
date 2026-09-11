import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommentLikesRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findByCommentAndUser(
    commentId: string,
    userId: string,
  ) {
    return this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });
  }

  async create(
    commentId: string,
    userId: string,
  ) {
    return this.prisma.commentLike.create({
      data: {
        commentId,
        userId,
      },
    });
  }

  async delete(
    commentId: string,
    userId: string,
  ) {
    return this.prisma.commentLike.delete({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });
  }

  async countByComment(
    commentId: string,
  ): Promise<number> {
    return this.prisma.commentLike.count({
      where: {
        commentId,
      },
    });
  }
}