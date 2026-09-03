import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TaskGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string, teamId: string) {
    return this.prisma.taskGroup.create({
      data: {
        name,
        teamId,
      },
    });
  }

  async findAllByTeam(teamId: string) {
    return this.prisma.taskGroup.findMany({
      where: {
        teamId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(groupId: string) {
    return this.prisma.taskGroup.findUnique({
      where: {
        id: groupId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });
  }

  async findByIdAndTeam(groupId: string, teamId: string) {
    return this.prisma.taskGroup.findFirst({
      where: {
        id: groupId,
        teamId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });
  }

  async update(groupId: string, name: string) {
    return this.prisma.taskGroup.update({
      where: {
        id: groupId,
      },
      data: {
        name,
      },
    });
  }

  async setShareToken(groupId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.taskGroup.update({
      where: { id: groupId },
      data: {
        shareTokenHash: tokenHash,
        shareExpiresAt: expiresAt,
        isPublic: true,
      },
    });
  }

  async findByShareTokenHash(tokenHash: string) {
    return this.prisma.taskGroup.findFirst({
      where: {
        shareTokenHash: tokenHash,
        isPublic: true,
      },
      include: {
        tasks: {
          include: {
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            attachments: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async revokeShareToken(groupId: string) {
    return this.prisma.taskGroup.update({
      where: { id: groupId },
      data: {
        shareTokenHash: null,
        shareExpiresAt: null,
        isPublic: false,
      },
    });
  }

  async delete(groupId: string) {
    return this.prisma.taskGroup.delete({
      where: {
        id: groupId,
      },
    });
  }
}
