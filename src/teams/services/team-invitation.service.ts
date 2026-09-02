import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

import { UsersRepository } from '../../users/users.repository';
import { TeamsRepository } from '../repositories/teams.repository';
import { TeamInvitationRepository } from '../repositories/team-invitation.repository';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { MailService } from '../../mail/mail.service';
import { TeamRole } from '../../lib/shared/enums/role.enum';

@Injectable()
export class TeamInvitationService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly teamsRepository: TeamsRepository,
    private readonly teamInvitationRepository: TeamInvitationRepository,
    private readonly mailService: MailService,
  ) {}

  private generateInvitationToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashInvitationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toTeamRole(role: string): TeamRole {
    if (role === TeamRole.ADMIN) {
      return TeamRole.ADMIN;
    }

    if (role === TeamRole.MEMBER) {
      return TeamRole.MEMBER;
    }

    throw new ConflictException('Invalid team role');
  }

  async createInvitation(
    teamId: string,
    createInvitationDto: CreateInvitationDto,
  ) {
    const { email, role } = createInvitationDto;

    const team = await this.teamsRepository.findById(teamId);

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const user = await this.usersRepository.findByEmail(email);

    const existingInvitation =
      await this.teamInvitationRepository.findPendingByEmailAndTeam(
        email,
        teamId,
      );

    if (existingInvitation) {
      throw new ConflictException(
        'A pending invitation already exists for this user',
      );
    }

    const invitationToken = this.generateInvitationToken();
    const tokenHash = this.hashInvitationToken(invitationToken);

    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * 7,
    );

    const invitation = await this.teamInvitationRepository.create({
      email,
      role,
      tokenHash,
      expiresAt,
      team: {
        connect: {
          id: teamId,
        },
      },
    });

    await this.mailService.sendTeamInvitation(
      email,
      team.name,
      invitationToken,
    );

    return {
      message: 'Invitation sent successfully',
      invitationId: invitation.id,
      userExists: !!user,
    };
  }

  async acceptInvitation(
    token: string,
    userId: string,
  ) {
    const tokenHash = this.hashInvitationToken(token);

    const invitation =
      await this.teamInvitationRepository.findByTokenHash(
        tokenHash,
      );

    if (!invitation) {
      throw new NotFoundException(
        'Invitation not found',
      );
    }

    if (invitation.acceptedAt) {
      throw new ConflictException(
        'Invitation has already been accepted',
      );
    }

    if (invitation.expiresAt <= new Date()) {
      throw new ConflictException(
        'Invitation has expired',
      );
    }

    const user =
      await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    if (
      user.email.toLowerCase() !==
      invitation.email.toLowerCase()
    ) {
      throw new ConflictException(
        'This invitation belongs to a different email address',
      );
    }

    const existingMembership =
      await this.teamsRepository.findMembership(
        userId,
        invitation.teamId,
      );

    if (existingMembership) {
      throw new ConflictException(
        'User is already a member of this team',
      );
    }

    const teamRole = this.toTeamRole(
      invitation.role,
    );

    await this.teamsRepository.addMember(
      userId,
      invitation.teamId,
      teamRole,
    );

    await this.teamInvitationRepository.markAccepted(
      invitation.id,
    );

    return {
      message: 'Invitation accepted successfully',
      teamId: invitation.teamId,
      role: teamRole,
    };
  }
}