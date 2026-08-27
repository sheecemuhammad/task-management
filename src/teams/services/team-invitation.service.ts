import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { Role } from '@prisma/client';

import { UsersRepository } from '../../users/users.repository';
import { TeamInvitationRepository } from '../repositories/team-invitation.repository';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { MailService } from '../../mail/mail.service';


@Injectable()
export class TeamInvitationService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly teamInvitationRepository: TeamInvitationRepository,
    private readonly mailService: MailService,
  ) {}

  private generateInvitationToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashInvitationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async createInvitation(
    teamId: string,
    createInvitationDto: CreateInvitationDto,
  ) {
    const { email, role } = createInvitationDto;

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

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

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

    return {
      invitation,
      invitationToken,
      userExists: !!user,
    };
  }
}
