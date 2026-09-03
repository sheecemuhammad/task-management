import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTaskInTeam(
    taskId: string,
    groupId: string,
    teamId: string,
  ) {
    return this.prisma.task.findFirst({
      where: {
        id: taskId,
        groupId,
        taskGroup: {
          teamId,
        },
      },
    });
  }

  async findParentComment(
    parentId: string,
    taskId: string,
  ) {
    return this.prisma.comment.findFirst({
      where: {
        id: parentId,
        taskId,
      },
    });
  }

  async create(
    taskId: string,
    authorId: string,
    content: string,
    parentId?: string,
  ) {
    return this.prisma.comment.create({
      data: {
        taskId,
        authorId,
        content,
        parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findAllByTask(taskId: string) {
    return this.prisma.comment.findMany({
      where: {
        taskId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findByIdAndTask(
    commentId: string,
    taskId: string,
  ) {
    return this.prisma.comment.findFirst({
      where: {
        id: commentId,
        taskId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async update(
    commentId: string,
    content: string,
  ) {
    return this.prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async delete(commentId: string) {
    return this.prisma.comment.delete({
      where: {
        id: commentId,
      },
    });
  }
}