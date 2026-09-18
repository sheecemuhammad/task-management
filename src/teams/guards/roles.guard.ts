import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { SystemRole, TeamRole } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TeamsRepository } from '../repositories/teams.repository';

interface AuthenticatedUser {
  userId: string;
  systemRole: SystemRole;
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly teamsRepository: TeamsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<TeamRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;
    const userId = user.userId;

    const teamIdParam = request.params.teamId;

    if (typeof teamIdParam !== 'string' || !teamIdParam) {
      throw new ForbiddenException('Unable to determine user or team');
    }

    const teamId = teamIdParam;

    if (!userId) {
      throw new ForbiddenException('Unable to determine user or team');
    }

    // Global OWNER has access to all teams.
    if (user.systemRole === SystemRole.OWNER) {
      return true;
    }

    // Normal users must belong to the requested team.
    const membership = await this.teamsRepository.findMembership(
      userId,
      teamId,
    );

    if (!membership) {
      throw new ForbiddenException('You are not a member of this team');
    }

    // Check the user's team-level role.
    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('You do not have the required role');
    }

    return true;
  }
}
