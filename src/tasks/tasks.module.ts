import { Module } from '@nestjs/common';

import { TasksController } from './controllers/tasks.controller';
import { TasksService } from './services/tasks.service';
import { TasksRepository } from './repositories/tasks.repositories';
import { PublicTasksController } from './controllers/public-tasks.controller';

import { PermissionsGuard } from '../teams/guards/permissions.guard';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [TeamsModule],
  controllers: [TasksController, PublicTasksController],
  providers: [
    TasksService,
    TasksRepository,
    PermissionsGuard,
  ],
})
export class TasksModule {}