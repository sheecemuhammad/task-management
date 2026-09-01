import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { TeamsRepository } from '../repositories/teams.repository';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly teamsRepository: TeamsRepository,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !requiredRoles ||
      requiredRoles.length === 0
    ) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    const userId = request.user?.userId;
    const teamId = request.params?.teamId;

    if (!userId || !teamId) {
      throw new ForbiddenException(
        'Unable to determine user or team',
      );
    }

    const membership =
      await this.teamsRepository.findMembership(
        userId,
        teamId,
      );

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this team',
      );
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have the required role',
      );
    }

    return true;
  }
}