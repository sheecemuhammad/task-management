import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import {
  Server,
  Socket,
} from 'socket.io';

import {
  Server as HttpServer,
} from 'http';

import { JoinRoomPolicy } from './join-room-policy';

import {
  taskRoom,
  taskGroupRoom,
  teamRoom,
  userRoom,
} from '../../realtime-contract/room-helpers';

interface SocketCallbackResponse {
  success: boolean;
  id?: string;
  message?: string;
}

@Injectable()
export class RealtimeSocketGatewayService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger =
    new Logger(
      RealtimeSocketGatewayService.name,
    );

  private io: Server | null = null;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly joinRoomPolicy: JoinRoomPolicy,
  ) {}

  // =====================================================
  // Module Init
  // =====================================================

  onModuleInit(): void {
    /*
     * Socket.IO server is initialized
     * from main.ts.
     */
  }

  // =====================================================
  // Get Socket Server
  // =====================================================

  getServer(): Server | null {
    return this.io;
  }

  // =====================================================
  // Initialize Socket.IO
  // =====================================================

  initialize(
    httpServer: HttpServer,
  ): void {
    if (this.io) {
      return;
    }

    this.io = new Server(
      httpServer,
      {
        cors: {
          origin:
            this.configService.get<string>(
              'FRONTEND_URL',
            ) || '*',
        },
      },
    );

    // ===================================================
    // Socket Authentication
    // ===================================================

    this.io.use(
      (socket, next) => {
        void this.authenticateSocket(
          socket,
          next,
        );
      },
    );

    // ===================================================
    // Connection Handler
    // ===================================================

    this.io.on(
      'connection',
      (socket) => {
        this.handleConnection(socket);
      },
    );

    this.logger.log(
      'Realtime Socket.IO gateway initialized',
    );
  }

  // =====================================================
  // Authenticate Socket
  // =====================================================

  private async authenticateSocket(
    socket: Socket,
    next: (
      error?: Error,
    ) => void,
  ): Promise<void> {
    try {
      const token =
        this.extractToken(socket);

      if (!token) {
        return next(
          new Error('Unauthorized'),
        );
      }

      const payload =
        await this.jwtService.verifyAsync(
          token,
        );

      if (!payload?.sub) {
        return next(
          new Error('Unauthorized'),
        );
      }

      socket.data.user = {
        id: payload.sub,
        systemRole:
          payload.systemRole,
      };

      next();
    } catch {
      next(
        new Error('Unauthorized'),
      );
    }
  }

  // =====================================================
  // Extract JWT Token
  // =====================================================

  private extractToken(
    socket: Socket,
  ): string | null {
    const authToken =
      socket.handshake.auth?.token;

    if (
      typeof authToken === 'string' &&
      authToken.length > 0
    ) {
      return authToken.startsWith(
        'Bearer ',
      )
        ? authToken.substring(7)
        : authToken;
    }

    const authorization =
      socket.handshake.headers
        .authorization;

    if (
      !authorization?.startsWith(
        'Bearer ',
      )
    ) {
      return null;
    }

    return authorization.substring(7);
  }

  // =====================================================
  // Handle Connection
  // =====================================================

  private handleConnection(
    socket: Socket,
  ): void {
    const userId =
      socket.data.user?.id;

    if (!userId) {
      socket.disconnect();
      return;
    }

    // ===================================================
    // User Room
    // ===================================================

    socket.join(
      userRoom(userId),
    );

    this.logger.log(
      `Realtime socket connected: ${socket.id} (user: ${userId})`,
    );

    // ===================================================
    // Join Team
    // ===================================================

    socket.on(
      'joinTeam',
      async (
        teamId: string,
        callback?: (
          response: SocketCallbackResponse,
        ) => void,
      ) => {
        try {
          const joined =
            await this.joinTeamRoom(
              socket,
              teamId,
            );

          callback?.({
            success: joined,
            id: teamId,
            ...(joined
              ? {}
              : {
                  message:
                    'You are not authorized to join this team room',
                }),
          });
        } catch (error) {
          this.logger.error(
            'Failed to join team room',
            error instanceof Error
              ? error.stack
              : String(error),
          );

          callback?.({
            success: false,
            id: teamId,
            message:
              'Failed to join team room',
          });
        }
      },
    );

    // ===================================================
    // Leave Team
    // ===================================================

    socket.on(
      'leaveTeam',
      async (
        teamId: string,
        callback?: (
          response: SocketCallbackResponse,
        ) => void,
      ) => {
        try {
          const left =
            await this.leaveTeamRoom(
              socket,
              teamId,
            );

          callback?.({
            success: left,
            id: teamId,
          });
        } catch (error) {
          this.logger.error(
            'Failed to leave team room',
            error instanceof Error
              ? error.stack
              : String(error),
          );

          callback?.({
            success: false,
            id: teamId,
            message:
              'Failed to leave team room',
          });
        }
      },
    );

    // ===================================================
    // Join Task Group
    // ===================================================

    socket.on(
      'joinTaskGroup',
      async (
        groupId: string,
        callback?: (
          response: SocketCallbackResponse,
        ) => void,
      ) => {
        try {
          const joined =
            await this.joinTaskGroupRoom(
              socket,
              groupId,
            );

          callback?.({
            success: joined,
            id: groupId,
            ...(joined
              ? {}
              : {
                  message:
                    'You are not authorized to join this task-group room',
                }),
          });
        } catch (error) {
          this.logger.error(
            'Failed to join task-group room',
            error instanceof Error
              ? error.stack
              : String(error),
          );

          callback?.({
            success: false,
            id: groupId,
            message:
              'Failed to join task-group room',
          });
        }
      },
    );

    // ===================================================
    // Leave Task Group
    // ===================================================

    socket.on(
      'leaveTaskGroup',
      async (
        groupId: string,
        callback?: (
          response: SocketCallbackResponse,
        ) => void,
      ) => {
        try {
          const left =
            await this.leaveTaskGroupRoom(
              socket,
              groupId,
            );

          callback?.({
            success: left,
            id: groupId,
          });
        } catch (error) {
          this.logger.error(
            'Failed to leave task-group room',
            error instanceof Error
              ? error.stack
              : String(error),
          );

          callback?.({
            success: false,
            id: groupId,
            message:
              'Failed to leave task-group room',
          });
        }
      },
    );

    // ===================================================
    // Join Task
    // ===================================================

    socket.on(
      'joinTask',
      async (
        taskId: string,
        callback?: (
          response: SocketCallbackResponse,
        ) => void,
      ) => {
        try {
          const joined =
            await this.joinTaskRoom(
              socket,
              taskId,
            );

          callback?.({
            success: joined,
            id: taskId,
            ...(joined
              ? {}
              : {
                  message:
                    'You are not authorized to join this task room',
                }),
          });
        } catch (error) {
          this.logger.error(
            'Failed to join task room',
            error instanceof Error
              ? error.stack
              : String(error),
          );

          callback?.({
            success: false,
            id: taskId,
            message:
              'Failed to join task room',
          });
        }
      },
    );

    // ===================================================
    // Leave Task
    // ===================================================

    socket.on(
      'leaveTask',
      async (
        taskId: string,
        callback?: (
          response: SocketCallbackResponse,
        ) => void,
      ) => {
        try {
          const left =
            await this.leaveTaskRoom(
              socket,
              taskId,
            );

          callback?.({
            success: left,
            id: taskId,
          });
        } catch (error) {
          this.logger.error(
            'Failed to leave task room',
            error instanceof Error
              ? error.stack
              : String(error),
          );

          callback?.({
            success: false,
            id: taskId,
            message:
              'Failed to leave task room',
          });
        }
      },
    );

    // ===================================================
    // Disconnect
    // ===================================================

    socket.on(
      'disconnect',
      (reason) => {
        this.logger.log(
          `Realtime socket disconnected: ${socket.id} (${reason})`,
        );
      },
    );
  }

  // =====================================================
  // Join Team Room
  // =====================================================

  async joinTeamRoom(
    socket: Socket,
    teamId: string,
  ): Promise<boolean> {
    const user =
      socket.data.user;

    if (
      !user?.id ||
      !teamId
    ) {
      return false;
    }

    const allowed =
      await this.joinRoomPolicy.canJoinTeamRoom(
        user,
        teamId,
      );

    if (!allowed) {
      this.logger.warn(
        `User ${user.id} denied access to team room: ${teamId}`,
      );

      return false;
    }

    await socket.join(
      teamRoom(teamId),
    );

    this.logger.log(
      `Socket ${socket.id} joined team room: ${teamRoom(teamId)}`,
    );

    return true;
  }

  // =====================================================
  // Leave Team Room
  // =====================================================

  async leaveTeamRoom(
    socket: Socket,
    teamId: string,
  ): Promise<boolean> {
    if (!teamId) {
      return false;
    }

    await socket.leave(
      teamRoom(teamId),
    );

    this.logger.log(
      `Socket ${socket.id} left team room: ${teamRoom(teamId)}`,
    );

    return true;
  }

  // =====================================================
  // Join Task Group Room
  // =====================================================

  async joinTaskGroupRoom(
    socket: Socket,
    groupId: string,
  ): Promise<boolean> {
    const user =
      socket.data.user;

    if (
      !user?.id ||
      !groupId
    ) {
      return false;
    }

    const allowed =
      await this.joinRoomPolicy.canJoinTaskGroupRoom(
        user,
        groupId,
      );

    if (!allowed) {
      this.logger.warn(
        `User ${user.id} denied access to task-group room: ${groupId}`,
      );

      return false;
    }

    await socket.join(
      taskGroupRoom(groupId),
    );

    this.logger.log(
      `Socket ${socket.id} joined task-group room: ${taskGroupRoom(groupId)}`,
    );

    return true;
  }

  // =====================================================
  // Leave Task Group Room
  // =====================================================

  async leaveTaskGroupRoom(
    socket: Socket,
    groupId: string,
  ): Promise<boolean> {
    if (!groupId) {
      return false;
    }

    await socket.leave(
      taskGroupRoom(groupId),
    );

    this.logger.log(
      `Socket ${socket.id} left task-group room: ${taskGroupRoom(groupId)}`,
    );

    return true;
  }

  // =====================================================
  // Join Task Room
  // =====================================================

  async joinTaskRoom(
    socket: Socket,
    taskId: string,
  ): Promise<boolean> {
    const user =
      socket.data.user;

    if (
      !user?.id ||
      !taskId
    ) {
      return false;
    }

    const allowed =
      await this.joinRoomPolicy.canJoinTaskRoom(
        user,
        taskId,
      );

    if (!allowed) {
      this.logger.warn(
        `User ${user.id} denied access to task room: ${taskId}`,
      );

      return false;
    }

    await socket.join(
      taskRoom(taskId),
    );

    this.logger.log(
      `Socket ${socket.id} joined task room: ${taskRoom(taskId)}`,
    );

    return true;
  }

  // =====================================================
  // Leave Task Room
  // =====================================================

  async leaveTaskRoom(
    socket: Socket,
    taskId: string,
  ): Promise<boolean> {
    if (!taskId) {
      return false;
    }

    await socket.leave(
      taskRoom(taskId),
    );

    this.logger.log(
      `Socket ${socket.id} left task room: ${taskRoom(taskId)}`,
    );

    return true;
  }

  // =====================================================
  // Module Destroy
  // =====================================================

  async onModuleDestroy(): Promise<void> {
    if (this.io) {
      await this.io.close();
      this.io = null;
    }
  }
}