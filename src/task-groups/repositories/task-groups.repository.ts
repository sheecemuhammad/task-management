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

  async delete(groupId: string) {
    return this.prisma.taskGroup.delete({
      where: {
        id: groupId,
      },
    });
  }
}
