import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentsRepository } from '../repositories/comments.repository';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async create(
    teamId: string,
    groupId: string,
    taskId: string,
    authorId: string,
    dto: CreateCommentDto,
  ) {
    // 1. Make sure the task belongs to this team/group
    const task = await this.commentsRepository.findTaskInTeam(
      taskId,
      groupId,
      teamId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 2. If this is a reply, make sure parent belongs to same task
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

    // 3. Create the comment
    return this.commentsRepository.create(
      taskId,
      authorId,
      dto.content,
      dto.parentId,
    );
  }

  async findAll(
    teamId: string,
    groupId: string,
    taskId: string,
  ) {
    // Make sure task belongs to requested team/group
    const task = await this.commentsRepository.findTaskInTeam(
      taskId,
      groupId,
      teamId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const comments =
      await this.commentsRepository.findAllByTask(taskId);

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
    // 1. Make sure task belongs to team/group
    const task = await this.commentsRepository.findTaskInTeam(
      taskId,
      groupId,
      teamId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 2. Find comment
    const comment =
      await this.commentsRepository.findByIdAndTask(
        commentId,
        taskId,
      );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // 3. Only the author can update their comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'You can only update your own comments',
      );
    }

    return this.commentsRepository.update(
      commentId,
      dto.content,
    );
  }

  async delete(
    teamId: string,
    groupId: string,
    taskId: string,
    commentId: string,
    userId: string,
  ) {
    // 1. Make sure task belongs to team/group
    const task = await this.commentsRepository.findTaskInTeam(
      taskId,
      groupId,
      teamId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 2. Find comment
    const comment =
      await this.commentsRepository.findByIdAndTask(
        commentId,
        taskId,
      );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // 3. Only the author can delete their comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own comments',
      );
    }

    await this.commentsRepository.delete(commentId);

    return {
      id: comment.id,
      taskId: comment.taskId,
      deleted: true,
    };
  }

  private buildCommentTree(comments: any[]) {
    const commentMap = new Map<string, any>();
    const roots: any[] = [];

    // First create a node for every comment
    for (const comment of comments) {
      commentMap.set(comment.id, {
        ...comment,
        children: [],
      });
    }

    // Then connect children to their parents
    for (const comment of comments) {
      const node = commentMap.get(comment.id);

      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);

        if (parent) {
          parent.children.push(node);
        } else {
          // Safety fallback if parent no longer exists
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}