import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CommentsRepository } from '../repositories/comments.repository';

import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';

import { RealtimeService } from '../../common/realtime/realtime.service';
import { REALTIME_EVENTS } from '../../common/realtime-contract/events';
import { taskRoom } from '../../common/realtime-contract/room-helpers';

import {
  CommentCreatedPayload,
  CommentUpdatedPayload,
  CommentDeletedPayload,
} from '../../common/realtime-contract/payload';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly realtimeService: RealtimeService,
  ) {}

  async create(
    teamId: string,
    groupId: string,
    taskId: string,
    authorId: string,
    dto: CreateCommentDto,
  ) {
    const task = await this.commentsRepository.findTaskInTeam(
      taskId,
      groupId,
      teamId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (dto.parentId) {
      const parent = await this.commentsRepository.findParentComment(
        dto.parentId,
        taskId,
      );

      if (!parent) {
        throw new BadRequestException(
          'Parent comment does not belong to this task',
        );
      }
    }

    const comment = await this.commentsRepository.create(
      taskId,
      authorId,
      dto.content,
      dto.parentId,
    );

    const realtimePayload: CommentCreatedPayload = {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      content: comment.content,
      parentId: comment.parentId,
      createdAt: comment.createdAt.toISOString(),
    };

    await this.realtimeService.emitToRoom(
      taskRoom(taskId),
      REALTIME_EVENTS.COMMENT_CREATED,
      realtimePayload,
    );

    return comment;
  }

  async findAll(teamId: string, groupId: string, taskId: string) {
    const task = await this.commentsRepository.findTaskInTeam(
      taskId,
      groupId,
      teamId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const comments = await this.commentsRepository.findAllByTask(taskId);

    return this.buildCommentTree(comments);
  }

  async update(
    teamId: string,
    groupId: string,
    taskId: string,
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ) {
    const task = await this.commentsRepository.findTaskInTeam(
      taskId,
      groupId,
      teamId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const comment = await this.commentsRepository.findByIdAndTask(
      commentId,
      taskId,
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    const updatedComment = await this.commentsRepository.update(
      commentId,
      dto.content,
    );

    const realtimePayload: CommentUpdatedPayload = {
      id: updatedComment.id,
      taskId: updatedComment.taskId,
      authorId: updatedComment.authorId,
      content: updatedComment.content,
      parentId: updatedComment.parentId,
      createdAt: updatedComment.createdAt.toISOString(),
    };

    await this.realtimeService.emitToRoom(
      taskRoom(taskId),
      REALTIME_EVENTS.COMMENT_UPDATED,
      realtimePayload,
    );

    return updatedComment;
  }

  async delete(
    teamId: string,
    groupId: string,
    taskId: string,
    commentId: string,
    userId: string,
  ) {
    const task = await this.commentsRepository.findTaskInTeam(
      taskId,
      groupId,
      teamId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const comment = await this.commentsRepository.findByIdAndTask(
      commentId,
      taskId,
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentsRepository.delete(commentId);

    const deletedComment: CommentDeletedPayload = {
      id: comment.id,
      taskId: comment.taskId,
      deleted: true,
    };

    await this.realtimeService.emitToRoom(
      taskRoom(taskId),
      REALTIME_EVENTS.COMMENT_DELETED,
      deletedComment,
    );

    return deletedComment;
  }

  private buildCommentTree(comments: any[]) {
    const commentMap = new Map<string, any>();
    const roots: any[] = [];

    for (const comment of comments) {
      commentMap.set(comment.id, {
        ...comment,
        children: [],
      });
    }

    for (const comment of comments) {
      const node = commentMap.get(comment.id);

      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);

        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
