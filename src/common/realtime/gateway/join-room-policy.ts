import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';

export interface RealtimeRoomUser {
  id: string;
  systemRole?: string;
}

@Injectable()
export class JoinRoomPolicy {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =====================================================
  // Team Room
  // =====================================================

  async canJoinTeamRoom(
    user: RealtimeRoomUser,
    teamId: string,
  ): Promise<boolean> {
    if (!user?.id || !teamId) {
      return false;
    }

    // System owner can access all team rooms.
    if (user.systemRole === 'OWNER') {
      return true;
    }

    const membership =
      await this.prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: user.id,
            teamId,
          },
        },
      });

    return !!membership;
  }

  // =====================================================
  // Task Group Room
  // =====================================================

  async canJoinTaskGroupRoom(
    user: RealtimeRoomUser,
    groupId: string,
  ): Promise<boolean> {
    if (!user?.id || !groupId) {
      return false;
    }

    const taskGroup =
      await this.prisma.taskGroup.findUnique({
        where: {
          id: groupId,
        },
        select: {
          teamId: true,
        },
      });

    if (!taskGroup) {
      return false;
    }

    // System owner can access all task-group rooms.
    if (user.systemRole === 'OWNER') {
      return true;
    }

    const membership =
      await this.prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: user.id,
            teamId: taskGroup.teamId,
          },
        },
      });

    return !!membership;
  }

  // =====================================================
  // Task Room
  // =====================================================

  async canJoinTaskRoom(
    user: RealtimeRoomUser,
    taskId: string,
  ): Promise<boolean> {
    if (!user?.id || !taskId) {
      return false;
    }

    const task =
      await this.prisma.task.findUnique({
        where: {
          id: taskId,
        },
        select: {
          groupId: true,
        },
      });

    if (!task) {
      return false;
    }

    const taskGroup =
      await this.prisma.taskGroup.findUnique({
        where: {
          id: task.groupId,
        },
        select: {
          teamId: true,
        },
      });

    if (!taskGroup) {
      return false;
    }

    // System owner can access all task rooms.
    if (user.systemRole === 'OWNER') {
      return true;
    }

    const membership =
      await this.prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: user.id,
            teamId: taskGroup.teamId,
          },
        },
      });

    return !!membership;
  }
}