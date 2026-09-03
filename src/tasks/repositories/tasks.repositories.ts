import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGroupByTeam(groupId: string, teamId: string) {
    return this.prisma.taskGroup.findFirst({
      where: {
        id: groupId,
        teamId,
      },
    });
  }

  async create(
    title: string,
    description: string | undefined,
    status: TaskStatus,
    priority: number,
    dueDate: Date | undefined,
    groupId: string,
  ) {
    return this.prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate,
        groupId,
      },
      include: {
        taskGroup: true,
        assignees: {
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

  async findAllByGroup(groupId: string) {
    return this.prisma.task.findMany({
      where: {
        groupId,
      },
      include: {
        assignees: {
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
        _count: {
          select: {
            attachments: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByIdAndGroup(taskId: string, groupId: string, teamId: string) {
    return this.prisma.task.findFirst({
      where: {
        id: taskId,
        groupId,
        taskGroup: {
          teamId,
        },
      },
      include: {
        taskGroup: true,
        assignees: {
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
        attachments: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });
  }

  async update(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: number;
      dueDate?: Date | null;
    },
  ) {
    return this.prisma.task.update({
      where: {
        id: taskId,
      },
      data,
      include: {
        taskGroup: true,
        assignees: {
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
  async findTeamMembers(teamId: string, userIds: string[]) {
    return this.prisma.teamMember.findMany({
      where: {
        teamId,
        userId: {
          in: userIds,
        },
      },
      select: {
        userId: true,
      },
    });
  }

  async replaceAssignees(taskId: string, userIds: string[]) {
    await this.prisma.$transaction([
      this.prisma.taskAssignee.deleteMany({
        where: {
          taskId,
        },
      }),

      this.prisma.taskAssignee.createMany({
        data: userIds.map((userId) => ({
          taskId,
          userId,
        })),
      }),
    ]);

    return this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        assignees: {
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

  async delete(taskId: string) {
    return this.prisma.task.delete({
      where: {
        id: taskId,
      },
    });
  }
}
