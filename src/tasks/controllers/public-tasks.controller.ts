import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { TasksService } from '../services/tasks.service';

@Controller('public/tasks')
export class PublicTasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

  @Get(':token')
  async getPublicTask(
    @Param('token') token: string,
  ) {
    return this.tasksService.getPublicTask(token);
  }
}