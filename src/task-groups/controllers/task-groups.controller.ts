import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { TaskGroupsService } from '../services/task-groups.service';
import { CreateTaskGroupDto } from '../dto/create-task-group.dto';
import { UpdateTaskGroupDto } from '../dto/update-task-group.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../teams/guards/permissions.guard';
import { Permissions } from '../../teams/decorators/permissions.decorator';

@Controller('teams')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TaskGroupsController {
  constructor(
    private readonly taskGroupsService: TaskGroupsService,
  ) {}

  @Post(':teamId/task-groups')
  @Permissions('task_group:create')
  async create(
    @Param('teamId') teamId: string,
    @Body() createTaskGroupDto: CreateTaskGroupDto,
  ) {
    return this.taskGroupsService.create(
      teamId,
      createTaskGroupDto,
    );
  }

  @Get(':teamId/task-groups')
  @Permissions('task_group:view')
  async findAll(
    @Param('teamId') teamId: string,
  ) {
    return this.taskGroupsService.findAll(teamId);
  }

  @Get(':teamId/task-groups/:groupId')
  @Permissions('task_group:view')
  async findById(
    @Param('teamId') teamId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.taskGroupsService.findById(
      groupId,
      teamId,
    );
  }

  @Patch(':teamId/task-groups/:groupId')
  @Permissions('task_group:update')
  async update(
    @Param('teamId') teamId: string,
    @Param('groupId') groupId: string,
    @Body() updateTaskGroupDto: UpdateTaskGroupDto,
  ) {
    return this.taskGroupsService.update(
      groupId,
      teamId,
      updateTaskGroupDto,
    );
  }

  @Delete(':teamId/task-groups/:groupId')
  @Permissions('task_group:delete')
  async delete(
    @Param('teamId') teamId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.taskGroupsService.delete(
      groupId,
      teamId,
    );
  }
}