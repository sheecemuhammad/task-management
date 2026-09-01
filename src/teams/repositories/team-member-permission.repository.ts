import { Injectable } from '@nestjs/common';
import { Prisma, TeamMemberPermission } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TeamMemberPermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Find all permissions for a specific team member

  async findByTeamMember(teamMemberId: string) {
    return this.prisma.teamMemberPermission.findMany({
      where: {
        teamMemberId,
      },
      include: {
        permission: {
          include: {
            feature: true,
          },
        },
      },
    });
  }

  // Find permissions by their IDs

  async findPermissionsByIds(permissionIds: string[]) {
    return this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });
  }

  // Find a specific permission for a team member

  async findByTeamMemberAndPermission(
    teamMemberId: string,
    permissionId: string,
  ): Promise<TeamMemberPermission | null> {
    return this.prisma.teamMemberPermission.findUnique({
      where: {
        teamMemberId_permissionId: {
          teamMemberId,
          permissionId,
        },
      },
    });
  }

  // Create a new team member permission

  async create(
    data: Prisma.TeamMemberPermissionCreateInput,
  ): Promise<TeamMemberPermission> {
    return this.prisma.teamMemberPermission.create({
      data,
    });
  }

  // Delete a specific permission for a team member

  async delete(
    teamMemberId: string,
    permissionId: string,
  ): Promise<TeamMemberPermission> {
    return this.prisma.teamMemberPermission.delete({
      where: {
        teamMemberId_permissionId: {
          teamMemberId,
          permissionId,
        },
      },
    });
  }

  // Replace all permissions for a team member with a new set of permissions

  async replacePermissions(
    teamMemberId: string,
    permissionIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.teamMemberPermission.deleteMany({
        where: {
          teamMemberId,
        },
      });

      if (permissionIds.length > 0) {
        await tx.teamMemberPermission.createMany({
          data: permissionIds.map((permissionId) => ({
            teamMemberId,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  // Delete all permissions for a specific team member

  async deleteAllForTeamMember(teamMemberId: string): Promise<void> {
    await this.prisma.teamMemberPermission.deleteMany({
      where: {
        teamMemberId,
      },
    });
  }

  // Create multiple team member permissions at once

  async createMany(
    data: Prisma.TeamMemberPermissionCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.teamMemberPermission.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
