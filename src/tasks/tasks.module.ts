import { Module } from '@nestjs/common';

import { TasksController } from './controllers/tasks.controller';
import { TasksService } from './services/tasks.service';
import { TasksRepository } from './repositories/tasks.repositories';

import { PermissionsGuard } from '../teams/guards/permissions.guard';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [TeamsModule],
  controllers: [TasksController],
  providers: [
    TasksService,
    TasksRepository,
    PermissionsGuard,
  ],
})
export class TasksModule {}