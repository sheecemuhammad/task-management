import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import {
  PERMISSIONS_KEY,
} from '../decorators/permissions.decorator';

import { TeamsRepository } from '../repositories/teams.repository';
import { TeamMemberPermissionRepository } from '../repositories/team-member-permission.repository';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly teamsRepository: TeamsRepository,
    private readonly teamMemberPermissionRepository: TeamMemberPermissionRepository,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    // If endpoint doesn't require permissions,
    // allow the request to continue.
    if (
      !requiredPermissions ||
      requiredPermissions.length === 0
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

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

    // Owner has full access to the team.
    if (membership.role === Role.OWNER) {
      return true;
    }

    const assignedPermissions =
      await this.teamMemberPermissionRepository.findByTeamMember(
        membership.id,
      );

    const assignedPermissionKeys =
      new Set(
        assignedPermissions.map(
          (item) => item.permission.key,
        ),
      );

    const hasAllRequiredPermissions =
      requiredPermissions.every(
        (permission) =>
          assignedPermissionKeys.has(permission),
      );

    if (!hasAllRequiredPermissions) {
      throw new ForbiddenException(
        'You do not have the required permission',
      );
    }

    return true;
  }
}