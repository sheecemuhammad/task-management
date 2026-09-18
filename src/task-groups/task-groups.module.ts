import { Module } from '@nestjs/common';

import { TaskGroupsController } from './controllers/task-groups.controller';
import { TaskGroupsService } from './services/task-groups.service';
import { TaskGroupsRepository } from './repositories/task-groups.repository';
import { PublicTaskGroupsController } from './controllers/public-task-groups.controller';

import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [TeamsModule],

  controllers: [TaskGroupsController, PublicTaskGroupsController],

  providers: [TaskGroupsService, TaskGroupsRepository],
})
export class TaskGroupsModule {}
