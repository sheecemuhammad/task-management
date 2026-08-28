import {
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { TeamInvitationService } from '../services/team-invitation.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('invitations')
export class AcceptInvitationController {
  constructor(
    private readonly teamInvitationService: TeamInvitationService,
  ) {}

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvitation(
    @Param('token') token: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamInvitationService.acceptInvitation(
      token,
      req.user.userId,
    );
  }
}