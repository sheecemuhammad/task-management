import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, TeamInvitation, TeamMember, TeamRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TeamInvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.TeamInvitationCreateInput,
  ): Promise<TeamInvitation> {
    return this.prisma.teamInvitation.create({
      data,
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.teamInvitation.delete({
      where: {
        id,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<TeamInvitation | null> {
    return this.prisma.teamInvitation.findUnique({
      where: {
        tokenHash,
      },
      include: {
        team: true,
      },
    });
  }

  async findPendingByEmailAndTeam(
    email: string,
    teamId: string,
  ): Promise<TeamInvitation | null> {
    return this.prisma.teamInvitation.findFirst({
      where: {
        email: email.toLowerCase(),
        teamId,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async markAccepted(id: string): Promise<TeamInvitation> {
    return this.prisma.teamInvitation.update({
      where: {
        id,
      },
      data: {
        acceptedAt: new Date(),
      },
    });
  }

  async acceptAndAddMember(
    invitationId: string,
    userId: string,
    teamId: string,
    role: TeamRole,
  ): Promise<{ member: TeamMember; invitation: TeamInvitation }> {
    return this.prisma.$transaction(async (tx) => {
      const pending = await tx.teamInvitation.findFirst({
        where: {
          id: invitationId,
          acceptedAt: null,
        },
      });

      if (!pending) {
        throw new ConflictException(
          'Invitation has already been accepted or was not found',
        );
      }

      const member = await tx.teamMember.create({
        data: {
          userId,
          teamId,
          role,
        },
      });

      const invitation = await tx.teamInvitation.update({
        where: {
          id: invitationId,
        },
        data: {
          acceptedAt: new Date(),
        },
      });

      return { member, invitation };
    });
  }
}
