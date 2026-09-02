import { Module } from '@nestjs/common';
import { TaskGroupsController } from './controllers/task-groups.controller';
import { TaskGroupsService } from './services/task-groups.service';
import { TaskGroupsRepository } from './repositories/task-groups.repository';

@Module({
  controllers: [TaskGroupsController],
  providers: [TaskGroupsService, TaskGroupsRepository],
})
export class TaskGroupsModule {}
