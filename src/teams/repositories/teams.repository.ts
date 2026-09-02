import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TeamRole } from '../../lib/shared/enums/role.enum';

@Injectable()
export class TeamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTeamWithAdmin(name: string, userId: string) {
    return this.prisma.team.create({
      data: {
        name,

        members: {
          create: {
            userId,
            role: TeamRole.ADMIN,
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
  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        systemRole: true,
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

  async addMember(userId: string, teamId: string, role: TeamRole) {
    return this.prisma.teamMember.create({
      data: {
        userId,
        teamId,
        role,
      },
    });
  }
  async updateMemberRole(memberId: string, teamId: string, role: TeamRole) {
    return this.prisma.teamMember.updateMany({
      where: {
        id: memberId,
        teamId,
      },
      data: {
        role,
      },
    });
  }
}
