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

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CommentsService } from '../services/comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../teams/guards/permissions.guard';
import { Permissions } from '../../teams/decorators/permissions.decorator';

@ApiTags('Comments')
@ApiBearerAuth('access-token')
@Controller('teams/:teamId/task-groups/:groupId/tasks/:taskId/comments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
  ) {}

  // =====================================================
  // Create Comment
  // =====================================================

  @Post()
  @Permissions('comment:create')
  @ApiOperation({
    summary: 'Create a comment',
    description:
      'Creates a comment on a task. Supports N-level nested comments using parentId.',
  })
  @ApiParam({
    name: 'teamId',
    description: 'Team UUID',
    example: '58cdd165-b59a-404a-a0c6-0492ba983018',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Task group UUID',
    example: '369ba7a7-ccb7-4464-92f2-dd79d9cd71ec',
  })
  @ApiParam({
    name: 'taskId',
    description: 'Task UUID',
    example: '73bf53d7-3691-41b7-941a-b1f9c03af1de',
  })
  @ApiBody({
    type: CreateCommentDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parent comment.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions.',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found.',
  })
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

  // =====================================================
  // Get Comments
  // =====================================================

  @Get()
  @Permissions('comment:view')
  @ApiOperation({
    summary: 'Get task comments',
    description:
      'Returns all comments for a task as an N-level nested comment tree.',
  })
  @ApiParam({
    name: 'teamId',
    description: 'Team UUID',
    example: '58cdd165-b59a-404a-a0c6-0492ba983018',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Task group UUID',
    example: '369ba7a7-ccb7-4464-92f2-dd79d9cd71ec',
  })
  @ApiParam({
    name: 'taskId',
    description: 'Task UUID',
    example: '73bf53d7-3691-41b7-941a-b1f9c03af1de',
  })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions.',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found.',
  })
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

  // =====================================================
  // Update Comment
  // =====================================================

  @Patch(':commentId')
  @Permissions('comment:update')
  @ApiOperation({
    summary: 'Update a comment',
    description:
      'Updates a comment. Users can only update their own comments.',
  })
  @ApiParam({
    name: 'teamId',
    description: 'Team UUID',
    example: '58cdd165-b59a-404a-a0c6-0492ba983018',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Task group UUID',
    example: '369ba7a7-ccb7-4464-92f2-dd79d9cd71ec',
  })
  @ApiParam({
    name: 'taskId',
    description: 'Task UUID',
    example: '73bf53d7-3691-41b7-941a-b1f9c03af1de',
  })
  @ApiParam({
    name: 'commentId',
    description: 'Comment UUID',
    example: '586d08d2-c713-412f-8857-cfc77063d70c',
  })
  @ApiBody({
    type: UpdateCommentDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Insufficient permissions or comment ownership violation.',
  })
  @ApiResponse({
    status: 404,
    description: 'Task or comment not found.',
  })
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

  // =====================================================
  // Delete Comment
  // =====================================================

  @Delete(':commentId')
  @Permissions('comment:delete')
  @ApiOperation({
    summary: 'Delete a comment',
    description:
      'Deletes a comment. Users can only delete their own comments.',
  })
  @ApiParam({
    name: 'teamId',
    description: 'Team UUID',
    example: '58cdd165-b59a-404a-a0c6-0492ba983018',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Task group UUID',
    example: '369ba7a7-ccb7-4464-92f2-dd79d9cd71ec',
  })
  @ApiParam({
    name: 'taskId',
    description: 'Task UUID',
    example: '73bf53d7-3691-41b7-941a-b1f9c03af1de',
  })
  @ApiParam({
    name: 'commentId',
    description: 'Comment UUID',
    example: '586d08d2-c713-412f-8857-cfc77063d70c',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Insufficient permissions or comment ownership violation.',
  })
  @ApiResponse({
    status: 404,
    description: 'Task or comment not found.',
  })
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