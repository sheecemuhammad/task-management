import { Injectable } from '@nestjs/common';
import { Prisma, TeamInvitation } from '@prisma/client';
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

  async findByTokenHash(
    tokenHash: string,
  ): Promise<TeamInvitation | null> {
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
        email,
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
}