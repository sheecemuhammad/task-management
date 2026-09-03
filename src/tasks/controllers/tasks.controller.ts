import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { TasksService } from '../services/tasks.service';

import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { AssignTaskDto } from '../dto/assign-task.dto';
import { CreateShareDto } from '../dto/create-share.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../teams/guards/permissions.guard';
import { Permissions } from '../../teams/decorators/permissions.decorator';

@Controller('teams')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post(':teamId/task-groups/:groupId/tasks')
  @Permissions('task:create')
  async create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(teamId, groupId, createTaskDto);
  }

  @Get(':teamId/task-groups/:groupId/tasks')
  @Permissions('task:view')
  async findAll(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    return this.tasksService.findAll(teamId, groupId);
  }

  @Get(':teamId/task-groups/:groupId/tasks/:taskId')
  @Permissions('task:view')
  async findById(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.tasksService.findById(teamId, groupId, taskId);
  }

  @Patch(':teamId/task-groups/:groupId/tasks/:taskId')
  @Permissions('task:update')
  async update(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(teamId, groupId, taskId, updateTaskDto);
  }

  @Put(':teamId/task-groups/:groupId/tasks/:taskId/assignees')
  @Permissions('task:assign')
  async assignAssignees(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() assignTaskDto: AssignTaskDto,
  ) {
    return this.tasksService.assignAssignees(
      teamId,
      groupId,
      taskId,
      assignTaskDto,
    );
  }

  @Post(':teamId/task-groups/:groupId/tasks/:taskId/share')
  @Permissions('task:update')
  async createShare(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() createShareDto: CreateShareDto,
  ) {
    return this.tasksService.createShare(
      teamId,
      groupId,
      taskId,
      createShareDto,
    );
  }

  @Delete(':teamId/task-groups/:groupId/tasks/:taskId/share')
  @Permissions('task:update')
  async revokeShare(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.tasksService.revokeShare(teamId, groupId, taskId);
  }

  @Delete(':teamId/task-groups/:groupId/tasks/:taskId')
  @Permissions('task:delete')
  async delete(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.tasksService.delete(teamId, groupId, taskId);
  }
}
