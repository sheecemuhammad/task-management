import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { TeamInvitationService } from '../services/team-invitation.service';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TeamRole } from '../../lib/shared/enums/role.enum';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamInvitationController {
  constructor(
    private readonly teamInvitationService: TeamInvitationService,
  ) {}

  @Post(':teamId/invitations')
  @UseGuards(RolesGuard)
  @Roles(TeamRole.ADMIN)
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