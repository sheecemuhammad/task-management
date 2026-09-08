import {
  Ack,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';

import { WsException } from '@nestjs/websockets';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { Server, Socket } from 'socket.io';

import { TeamsRepository } from '../../teams/repositories/teams.repository';
import { CommentsRepository } from '../repositories/comments.repository';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CommentsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly teamsRepository: TeamsRepository,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  // =====================================================
  // WebSocket JWT Authentication
  // =====================================================

  async handleConnection(socket: Socket) {
    try {
      const authHeader = socket.handshake.headers.authorization;

      if (!authHeader) {
        console.log(`Socket ${socket.id} rejected: No authorization header`);

        socket.disconnect();
        return;
      }

      if (!authHeader.startsWith('Bearer ')) {
        console.log(
          `Socket ${socket.id} rejected: Invalid authorization format`,
        );

        socket.disconnect();
        return;
      }

      const token = authHeader.substring(7);

      const jwtSecret = this.configService.get<string>('auth.jwtSecret');

      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtSecret,
      });

      socket.data.user = {
        userId: payload.sub,
        email: payload.email,
        systemRole: payload.systemRole,
      };

      console.log(`Socket ${socket.id} authenticated as user ${payload.sub}`);
    } catch (error) {
      console.log(`Socket ${socket.id} rejected: Invalid JWT`);

      socket.disconnect();
    }
  }

  // =====================================================
  // Join Task Room
  // =====================================================

  @SubscribeMessage('joinTask')
  async handleJoinTask(
    @MessageBody()
    data: { taskId: string },

    @ConnectedSocket()
    socket: Socket,

    @Ack()
    ack: (response: any) => void,
  ) {
    try {
      // -----------------------------------------------
      // 1. Check WebSocket authentication
      // -----------------------------------------------

      const user = socket.data.user;

      if (!user?.userId) {
        throw new WsException('Unauthorized');
      }

      // -----------------------------------------------
      // 2. Validate taskId
      // -----------------------------------------------

      if (!data?.taskId) {
        throw new WsException('taskId is required');
      }

      // -----------------------------------------------
      // 3. Find task and its team
      // -----------------------------------------------

      const task = await this.commentsRepository.findTaskWithTeam(data.taskId);

      if (!task) {
        throw new WsException('Task not found');
      }

      const teamId = task.taskGroup.teamId;

      // -----------------------------------------------
      // 4. Check team membership
      // -----------------------------------------------

      const membership = await this.teamsRepository.findMembership(
        user.userId,
        teamId,
      );

      // System OWNER can access all teams
      const isSystemOwner = user.systemRole === 'OWNER';

      if (!membership && !isSystemOwner) {
        throw new WsException('You are not a member of this team');
      }

      // -----------------------------------------------
      // 5. Join isolated task room
      // -----------------------------------------------

      const room = `room_task_${data.taskId}`;

      await socket.join(room);

      console.log(`Socket ${socket.id} joined room: ${room}`);

      // -----------------------------------------------
      // 6. Send acknowledgement
      // -----------------------------------------------

      ack({
        event: 'joinedTask',
        taskId: data.taskId,
        room,
      });
    } catch (error) {
      console.log(`Socket ${socket.id} failed to join task room`);

      ack({
        event: 'joinTask:error',
        taskId: data?.taskId,
        message:
          error instanceof WsException
            ? error.message
            : 'Unable to join task room',
      });
    }
  }

  // =====================================================
  // Leave Task Room
  // =====================================================

  @SubscribeMessage('leaveTask')
  async handleLeaveTask(
    @MessageBody()
    data: { taskId: string },

    @ConnectedSocket()
    socket: Socket,

    @Ack()
    ack: (response: any) => void,
  ) {
    const user = socket.data.user;

    // -----------------------------------------------
    // Check authentication
    // -----------------------------------------------

    if (!user?.userId) {
      ack({
        event: 'leaveTask:error',
        message: 'Unauthorized',
      });

      return;
    }

    // -----------------------------------------------
    // Validate taskId
    // -----------------------------------------------

    if (!data?.taskId) {
      ack({
        event: 'leaveTask:error',
        message: 'taskId is required',
      });

      return;
    }

    // -----------------------------------------------
    // Leave room
    // -----------------------------------------------

    const room = `room_task_${data.taskId}`;

    await socket.leave(room);

    console.log(`Socket ${socket.id} left room: ${room}`);

    // -----------------------------------------------
    // Acknowledgement
    // -----------------------------------------------

    ack({
      event: 'leftTask',
      taskId: data.taskId,
      room,
    });
  }

  // =====================================================
  // Real-Time Comment Events
  // =====================================================

  broadcastCommentCreated(taskId: string, comment: any) {
    const room = `room_task_${taskId}`;

    this.server.to(room).emit('comment:created', comment);
  }

  broadcastCommentUpdated(taskId: string, comment: any) {
    const room = `room_task_${taskId}`;

    this.server.to(room).emit('comment:updated', comment);
  }

  broadcastCommentDeleted(taskId: string, comment: any) {
    const room = `room_task_${taskId}`;

    this.server.to(room).emit('comment:deleted', comment);
  }
}
