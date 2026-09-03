import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CommentsService } from '../services/comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './../../teams/guards/permissions.guard';
import { Permissions } from './../../teams/decorators/permissions.decorator';

@Controller(
  'teams/:teamId/task-groups/:groupId/tasks/:taskId/comments',
)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @Permissions('comment:create')
  async create(
    @Param('teamId') teamId: string,
    @Param('groupId') groupId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.create(
      teamId,
      groupId,
      taskId,
      req.user.userId,
      dto,
    );
  }

  @Get()
  @Permissions('comment:view')
  async findAll(
    @Param('teamId') teamId: string,
    @Param('groupId') groupId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.commentsService.findAll(
      teamId,
      groupId,
      taskId,
    );
  }

  @Patch(':commentId')
  @Permissions('comment:update')
  async update(
    @Param('teamId') teamId: string,
    @Param('groupId') groupId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.update(
      teamId,
      groupId,
      taskId,
      commentId,
      req.user.userId,
      dto,
    );
  }

  @Delete(':commentId')
  @Permissions('comment:delete')
  async delete(
    @Param('teamId') teamId: string,
    @Param('groupId') groupId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    return this.commentsService.delete(
      teamId,
      groupId,
      taskId,
      commentId,
      req.user.userId,
    );
  }
}