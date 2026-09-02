import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SystemRole, TeamRole } from '../../lib/shared/enums/role.enum';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

import { TeamsRepository } from '../repositories/teams.repository';
import { TeamMemberPermissionRepository } from '../repositories/team-member-permission.repository';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly teamsRepository: TeamsRepository,
    private readonly teamMemberPermissionRepository: TeamMemberPermissionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If endpoint doesn't require permissions,
    // allow the request to continue.
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user;
    const userId = user?.userId;
    const teamId = request.params?.teamId;

    if (!userId || !teamId) {
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

    // Team ADMIN has full authority within this team.
    if (membership.role === TeamRole.ADMIN) {
      return true;
    }

    // Team MEMBER must have the required granular permissions.
    const assignedPermissions =
      await this.teamMemberPermissionRepository.findByTeamMember(membership.id);

    const assignedPermissionKeys = new Set(
      assignedPermissions.map((item) => item.permission.key),
    );

    console.log('Required permissions:', requiredPermissions);
    console.log('Assigned permission keys:', [...assignedPermissionKeys]);

    const hasAllRequiredPermissions = requiredPermissions.every((permission) =>
      assignedPermissionKeys.has(permission),
    );

    if (!hasAllRequiredPermissions) {
      throw new ForbiddenException('You do not have the required permission');
    }

    return true;
  }
}
