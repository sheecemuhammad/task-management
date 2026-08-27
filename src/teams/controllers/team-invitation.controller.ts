import { Body, Controller, Param, Post } from '@nestjs/common';

import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { TeamInvitationService } from '../services/team-invitation.service';

@Controller('teams')
export class TeamInvitationController {
  constructor(private readonly teamInvitationService: TeamInvitationService) {}

  @Post(':teamId/invitations')
  async createInvitation(
    @Param('teamId') teamId: string,
    @Body() createInvitationDto: CreateInvitationDto,
  ) {
    return this.teamInvitationService.createInvitation(
      teamId,
      createInvitationDto,
    );
  }
}
