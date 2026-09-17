import { Injectable, NotFoundException } from '@nestjs/common';

import {
  generateShareToken,
  hashShareToken,
} from '../../common/utils/share-token.util';

import { TaskGroupsRepository } from '../repositories/task-groups.repository';
import { CreateTaskGroupDto } from '../dto/create-task-group.dto';
import { UpdateTaskGroupDto } from '../dto/update-task-group.dto';
import { CreateShareDto } from '../../tasks/dto/create-share.dto';

import { RealtimeService } from '../../common/realtime/realtime.service';
import { REALTIME_EVENTS } from '../../common/realtime-contract/events';
import { teamRoom } from '../../common/realtime-contract/room-helpers';

@Injectable()
export class TaskGroupsService {
  constructor(
    private readonly taskGroupsRepository: TaskGroupsRepository,
    private readonly realtimeService: RealtimeService,
  ) {}

  // =====================================================
  // Create Task Group
  // =====================================================

  async create(
    teamId: string,
    createTaskGroupDto: CreateTaskGroupDto,
  ) {
    const taskGroup = await this.taskGroupsRepository.create(
      createTaskGroupDto.name,
      teamId,
    );

    // Notify users currently viewing this team's
    // task-group list.
    await this.realtimeService.emitToRoom(
      teamRoom(teamId),
      REALTIME_EVENTS.TASK_GROUP_CREATED,
      taskGroup,
    );

    return taskGroup;
  }

  // =====================================================
  // Find All Task Groups
  // =====================================================

  async findAll(teamId: string) {
    return this.taskGroupsRepository.findAllByTeam(teamId);
  }

  // =====================================================
  // Find Task Group By ID
  // =====================================================

  async findById(groupId: string, teamId: string) {
    const taskGroup =
      await this.taskGroupsRepository.findByIdAndTeam(
        groupId,
        teamId,
      );

    if (!taskGroup) {
      throw new NotFoundException(
        'Task group not found',
      );
    }

    return taskGroup;
  }

  // =====================================================
  // Update Task Group
  // =====================================================

  async update(
    groupId: string,
    teamId: string,
    updateTaskGroupDto: UpdateTaskGroupDto,
  ) {
    await this.findById(groupId, teamId);

    const updatedTaskGroup =
      await this.taskGroupsRepository.update(
        groupId,
        updateTaskGroupDto.name,
      );

    // Notify users currently viewing this team's
    // task-group list.
    await this.realtimeService.emitToRoom(
      teamRoom(teamId),
      REALTIME_EVENTS.TASK_GROUP_UPDATED,
      updatedTaskGroup,
    );

    return updatedTaskGroup;
  }

  // =====================================================
  // Create Share
  // =====================================================

  async createShare(
    teamId: string,
    groupId: string,
    createShareDto: CreateShareDto,
  ) {
    const group =
      await this.taskGroupsRepository.findByIdAndTeam(
        groupId,
        teamId,
      );

    if (!group) {
      throw new NotFoundException(
        'Task group not found',
      );
    }

    const token = generateShareToken();
    const tokenHash = hashShareToken(token);

    const expiresInDays =
      createShareDto.expiresInDays ?? 7;

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + expiresInDays,
    );

    await this.taskGroupsRepository.setShareToken(
      groupId,
      tokenHash,
      expiresAt,
    );

    return {
      token,
      expiresAt,
    };
  }

  // =====================================================
  // Revoke Share
  // =====================================================

  async revokeShare(
    teamId: string,
    groupId: string,
  ) {
    const group =
      await this.taskGroupsRepository.findByIdAndTeam(
        groupId,
        teamId,
      );

    if (!group) {
      throw new NotFoundException(
        'Task group not found',
      );
    }

    return this.taskGroupsRepository.revokeShareToken(
      groupId,
    );
  }

  // =====================================================
  // Get Public Task Group
  // =====================================================

  async getPublicTaskGroup(token: string) {
    const tokenHash = hashShareToken(token);

    const group =
      await this.taskGroupsRepository.findByShareTokenHash(
        tokenHash,
      );

    if (!group) {
      throw new NotFoundException(
        'Shared task group not found',
      );
    }

    if (
      !group.shareExpiresAt ||
      group.shareExpiresAt <= new Date()
    ) {
      throw new NotFoundException(
        'Share link has expired',
      );
    }

    return {
      id: group.id,
      name: group.name,

      tasks: group.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,

        assignees: task.assignees,

        attachments: task.attachments,
      })),
    };
  }

  // =====================================================
  // Delete Task Group
  // =====================================================

  async delete(
    groupId: string,
    teamId: string,
  ) {
    await this.findById(groupId, teamId);

    const deletedTaskGroup =
      await this.taskGroupsRepository.delete(
        groupId,
      );

    // Notify users currently viewing this team's
    // task-group list.
    await this.realtimeService.emitToRoom(
      teamRoom(teamId),
      REALTIME_EVENTS.TASK_GROUP_DELETED,
      {
        groupId,
      },
    );

    return deletedTaskGroup;
  }
}