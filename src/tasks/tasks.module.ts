import { Module } from '@nestjs/common';

import { TasksController } from './controllers/tasks.controller';
import { TasksService } from './services/tasks.service';
import { TasksRepository } from './repositories/tasks.repositories';
import { PublicTasksController } from './controllers/public-tasks.controller';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [TeamsModule],
  controllers: [TasksController, PublicTasksController],
  providers: [TasksService, TasksRepository],
})
export class TasksModule {}
