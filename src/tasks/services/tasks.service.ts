import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import {
  generateShareToken,
  hashShareToken,
} from '../../common/utils/share-token.util';

import { TaskStatus } from '@prisma/client';

import { TasksRepository } from '../repositories/tasks.repositories';

import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { AssignTaskDto } from '../dto/assign-task.dto';
import { CreateShareDto } from '../dto/create-share.dto';

import { RealtimeService } from '../../common/realtime/realtime.service';
import { REALTIME_EVENTS } from '../../common/realtime-contract/events';
import {
  taskRoom,
  taskGroupRoom,
} from '../../common/realtime-contract/room-helpers';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly realtimeService: RealtimeService,
  ) {}

  // =====================================================
  // Create Task
  // =====================================================

  async create(teamId: string, groupId: string, createTaskDto: CreateTaskDto) {
    const group = await this.tasksRepository.findGroupByTeam(groupId, teamId);

    if (!group) {
      throw new NotFoundException('Task group not found');
    }

    const task = await this.tasksRepository.create(
      createTaskDto.title,
      createTaskDto.description,
      createTaskDto.status ?? TaskStatus.TODO,
      createTaskDto.priority ?? 1,
      createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      groupId,
    );

    // Notify users viewing this task group.
    await this.realtimeService.emitToRoom(
      taskGroupRoom(groupId),
      REALTIME_EVENTS.TASK_CREATED,
      task,
    );

    return task;
  }

  // =====================================================
  // Find All Tasks
  // =====================================================

  async findAll(teamId: string, groupId: string) {
    const group = await this.tasksRepository.findGroupByTeam(groupId, teamId);

    if (!group) {
      throw new NotFoundException('Task group not found');
    }

    return this.tasksRepository.findAllByGroup(groupId);
  }

  // =====================================================
  // Find Task By ID
  // =====================================================

  async findById(teamId: string, groupId: string, taskId: string) {
    const task = await this.tasksRepository.findByIdAndGroup(
      taskId,
      groupId,
      teamId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  // =====================================================
  // Update Task
  // =====================================================

  async update(
    teamId: string,
    groupId: string,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
  ) {
    await this.findById(teamId, groupId, taskId);

    const data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: number;
      dueDate?: Date | null;
    } = {};

    if (updateTaskDto.title !== undefined) {
      data.title = updateTaskDto.title;
    }

    if (updateTaskDto.description !== undefined) {
      data.description = updateTaskDto.description;
    }

    if (updateTaskDto.status !== undefined) {
      data.status = updateTaskDto.status;
    }

    if (updateTaskDto.priority !== undefined) {
      data.priority = updateTaskDto.priority;
    }

    if (updateTaskDto.dueDate !== undefined) {
      data.dueDate = updateTaskDto.dueDate
        ? new Date(updateTaskDto.dueDate)
        : null;
    }

    const updatedTask = await this.tasksRepository.update(taskId, data);

    // Notify users currently viewing
    // this task.
    await this.realtimeService.emitToRoom(
      taskRoom(taskId),
      REALTIME_EVENTS.TASK_UPDATED,
      updatedTask,
    );

    return updatedTask;
  }

  // =====================================================
  // Assign Task Assignees
  // =====================================================

  async assignAssignees(
    teamId: string,
    groupId: string,
    taskId: string,
    assignTaskDto: AssignTaskDto,
  ) {
    // Make sure the task belongs to
    // the specified team and group.
    await this.findById(teamId, groupId, taskId);

    const requestedUserIds = [...new Set(assignTaskDto.assigneeIds)];

    const teamMembers = await this.tasksRepository.findTeamMembers(
      teamId,
      requestedUserIds,
    );

    const validMemberIds = new Set(teamMembers.map((member) => member.userId));

    const invalidUserIds = requestedUserIds.filter(
      (userId) => !validMemberIds.has(userId),
    );

    if (invalidUserIds.length > 0) {
      throw new BadRequestException(
        'One or more users are not members of this team',
      );
    }

    const assignees = await this.tasksRepository.replaceAssignees(
      taskId,
      requestedUserIds,
    );

    // Notify users currently viewing
    // this task.
    await this.realtimeService.emitToRoom(
      taskRoom(taskId),
      REALTIME_EVENTS.TASK_ASSIGNEES_UPDATED,
      {
        taskId,
        assigneeIds: requestedUserIds,
        assignees,
      },
    );

    return assignees;
  }

  // =====================================================
  // Create Share
  // =====================================================

  async createShare(
    teamId: string,
    groupId: string,
    taskId: string,
    createShareDto: CreateShareDto,
  ) {
    await this.findById(teamId, groupId, taskId);

    const token = generateShareToken();

    const tokenHash = hashShareToken(token);

    const expiresInDays = createShareDto.expiresInDays ?? 7;

    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.tasksRepository.setShareToken(taskId, tokenHash, expiresAt);

    return {
      token,
      expiresAt,
    };
  }

  // =====================================================
  // Revoke Share
  // =====================================================

  async revokeShare(teamId: string, groupId: string, taskId: string) {
    await this.findById(teamId, groupId, taskId);

    return this.tasksRepository.revokeShareToken(taskId);
  }

  // =====================================================
  // Get Public Task
  // =====================================================

  async getPublicTask(token: string) {
    const tokenHash = hashShareToken(token);

    const task = await this.tasksRepository.findByShareTokenHash(tokenHash);

    if (!task) {
      throw new NotFoundException('Shared task not found');
    }

    if (!task.shareExpiresAt || task.shareExpiresAt <= new Date()) {
      throw new NotFoundException('Share link has expired');
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      taskGroup: {
        id: task.taskGroup.id,
        name: task.taskGroup.name,
      },
      assignees: task.assignees,
      attachments: task.attachments,
    };
  }

  // =====================================================
  // Delete Task
  // =====================================================

  async delete(teamId: string, groupId: string, taskId: string) {
    await this.findById(teamId, groupId, taskId);

    const deletedTask = await this.tasksRepository.delete(taskId);

    // Notify users currently viewing
    // this task.
    await this.realtimeService.emitToRoom(
      taskRoom(taskId),
      REALTIME_EVENTS.TASK_DELETED,
      {
        taskId,
      },
    );

    return deletedTask;
  }
}
