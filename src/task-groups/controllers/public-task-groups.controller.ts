import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { TaskGroupsService } from '../services/task-groups.service';

@Controller('public/task-groups')
export class PublicTaskGroupsController {
  constructor(
    private readonly taskGroupsService: TaskGroupsService,
  ) {}

  @Get(':token')
  async getPublicTaskGroup(
    @Param('token') token: string,
  ) {
    return this.taskGroupsService.getPublicTaskGroup(
      token,
    );
  }
}