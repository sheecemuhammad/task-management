import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class TeamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTeamWithOwner(name: string, userId: string) {
    return this.prisma.team.create({
      data: {
        name,

        members: {
          create: {
            userId,
            role: Role.OWNER,
          },
        },
      },

      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(teamId: string) {
    return this.prisma.team.findUnique({
      where: {
        id: teamId,
      },

      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },

        taskGroups: true,
      },
    });
  }

  async findMembership(userId: string, teamId: string) {
    return this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });
  }

  async findTeamMemberById(teamMemberId: string, teamId: string) {
    return this.prisma.teamMember.findFirst({
      where: {
        id: teamMemberId,
        teamId,
      },
    });
  }

  async addMember(userId: string, teamId: string, role: Role) {
    return this.prisma.teamMember.create({
      data: {
        userId,
        teamId,
        role,
      },
    });
  }
}
