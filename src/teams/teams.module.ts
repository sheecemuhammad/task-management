import { Module } from '@nestjs/common';

import { TeamsController } from './controllers/teams.controller';
import { TeamsService } from './teams.service';
import { TeamsRepository } from './repositories/teams.repository';
import { TeamInvitationRepository } from './repositories/team-invitation.repository';
import { TeamInvitationService } from './services/team-invitation.service';
import { TeamInvitationController } from './controllers/team-invitation.controller';
import { AcceptInvitationController } from './controllers/accept-invitation.controller';

import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MailModule, UsersModule],

  controllers: [TeamsController, TeamInvitationController, AcceptInvitationController],

  providers: [
    TeamsService,
    TeamsRepository,
    TeamInvitationRepository,
    TeamInvitationService,
  ],

  exports: [
    TeamsService,
    TeamsRepository,
    TeamInvitationRepository,
    TeamInvitationService,
  ],
})
export class TeamsModule {}
