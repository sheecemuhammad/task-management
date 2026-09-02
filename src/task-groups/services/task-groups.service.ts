import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TaskGroupsRepository } from '../repositories/task-groups.repository';
import { CreateTaskGroupDto } from '../dto/create-task-group.dto';
import { UpdateTaskGroupDto } from '../dto/update-task-group.dto';

@Injectable()
export class TaskGroupsService {
  constructor(
    private readonly taskGroupsRepository: TaskGroupsRepository,
  ) {}

  async create(
    teamId: string,
    createTaskGroupDto: CreateTaskGroupDto,
  ) {
    return this.taskGroupsRepository.create(
      createTaskGroupDto.name,
      teamId,
    );
  }

  async findAll(teamId: string) {
    return this.taskGroupsRepository.findAllByTeam(teamId);
  }

  async findById(
    groupId: string,
    teamId: string,
  ) {
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

  async update(
    groupId: string,
    teamId: string,
    updateTaskGroupDto: UpdateTaskGroupDto,
  ) {
    await this.findById(groupId, teamId);

    return this.taskGroupsRepository.update(
      groupId,
      updateTaskGroupDto.name,
    );
  }

  async delete(
    groupId: string,
    teamId: string,
  ) {
    await this.findById(groupId, teamId);

    return this.taskGroupsRepository.delete(groupId);
  }
}