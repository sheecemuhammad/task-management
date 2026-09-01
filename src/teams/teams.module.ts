import { Module } from '@nestjs/common';

import { TeamsController } from './controllers/teams.controller';
import { TeamsService } from './teams.service';
import { TeamsRepository } from './repositories/teams.repository';
import { TeamInvitationRepository } from './repositories/team-invitation.repository';
import { TeamInvitationService } from './services/team-invitation.service';
import { TeamInvitationController } from './controllers/team-invitation.controller';
import { AcceptInvitationController } from './controllers/accept-invitation.controller';
import { TeamMemberPermissionService } from './services/team-member-permission.service';
import { TeamMemberPermissionRepository } from './repositories/team-member-permission.repository';
import { PermissionsGuard } from './guards/permissions.guard';
import { FeatureController } from './controllers/feature.controller';
import { FeatureRepository } from './repositories/feature.repository';
import { FeatureService } from './services/feature.service';
import { RolesGuard } from './guards/roles.guard';

import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { TeamMemberPermissionController } from './controllers/team-member-permission.controller';

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
    TeamsService,
    TeamsRepository,
    TeamInvitationRepository,
    TeamInvitationService,
    TeamMemberPermissionService,
    TeamMemberPermissionRepository,
    FeatureService,
    FeatureRepository,
  ],
})
export class TeamsModule {}
