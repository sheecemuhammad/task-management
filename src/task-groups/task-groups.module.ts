import { Module } from '@nestjs/common';

import { TaskGroupsController } from './controllers/task-groups.controller';
import { TaskGroupsService } from './services/task-groups.service';
import { TaskGroupsRepository } from './repositories/task-groups.repository';

import { PermissionsGuard } from '../teams/guards/permissions.guard';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [TeamsModule],

  controllers: [TaskGroupsController],

  providers: [
    TaskGroupsService,
    TaskGroupsRepository,
    PermissionsGuard,
  ],
})
export class TaskGroupsModule {}