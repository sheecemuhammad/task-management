import { Module } from '@nestjs/common';

import { TeamsController } from './controllers/teams.controller';
import { TeamsService } from './services/teams.service';

import { TeamsRepository } from './repositories/teams.repository';
import { TeamInvitationRepository } from './repositories/team-invitation.repository';
import { TeamInvitationService } from './services/team-invitation.service';
import { TeamInvitationController } from './controllers/team-invitation.controller';
import { AcceptInvitationController } from './controllers/accept-invitation.controller';

import { TeamMemberPermissionService } from './services/team-member-permission.service';
import { TeamMemberPermissionRepository } from './repositories/team-member-permission.repository';
import { TeamMemberPermissionController } from './controllers/team-member-permission.controller';

import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';

import { FeatureController } from './controllers/feature.controller';
import { FeatureRepository } from './repositories/feature.repository';
import { FeatureService } from './services/feature.service';

import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MailModule, UsersModule],

  controllers: [
    TeamsController,
    TeamInvitationController,
    AcceptInvitationController,
    TeamMemberPermissionController,
    FeatureController,
  ],

  providers: [
    TeamsService,
    TeamsRepository,
    TeamInvitationRepository,
    TeamInvitationService,
    TeamMemberPermissionService,
    TeamMemberPermissionRepository,
    PermissionsGuard,
    FeatureService,
    FeatureRepository,
    RolesGuard,
  ],

  exports: [
    TeamsRepository,
    TeamMemberPermissionRepository,
    PermissionsGuard,
  ],
})
export class TeamsModule {}