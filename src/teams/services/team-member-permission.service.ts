import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SystemRole, TeamRole } from '../../lib/shared/enums/role.enum';

import { TeamsRepository } from '../repositories/teams.repository';
import { TeamMemberPermissionRepository } from '../repositories/team-member-permission.repository';
import { UpdateMemberPermissionsDto } from '../dto/update-member-permissions.dto';

@Injectable()
export class TeamMemberPermissionService {
  constructor(
    private readonly teamsRepository: TeamsRepository,
    private readonly teamMemberPermissionRepository: TeamMemberPermissionRepository,
  ) {}

  async updateMemberPermissions(
    requesterUserId: string,
    teamId: string,
    targetMemberId: string,
    dto: UpdateMemberPermissionsDto,
  ) {
    // Check whether the requester belongs to the team.
    const requester = await this.teamsRepository.findMembership(
      requesterUserId,
      teamId,
    );

    // Global OWNER can access the team even without membership.
    const requesterUser = await this.teamsRepository.findUserById(
      requesterUserId,
    );

    if (!requesterUser) {
      throw new NotFoundException('Requester user not found');
    }

    const isGlobalOwner =
      requesterUser.systemRole === SystemRole.OWNER;

    if (!isGlobalOwner && !requester) {
      throw new ForbiddenException(
        'You are not a member of this team',
      );
    }

    // Normal users must be ADMINs of this team.
    if (!isGlobalOwner && requester?.role !== TeamRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to manage member permissions',
      );
    }

    // Target member must belong to this same team.
    const targetMember =
      await this.teamsRepository.findTeamMemberById(
        targetMemberId,
        teamId,
      );

    if (!targetMember) {
      throw new NotFoundException(
        'Target team member not found',
      );
    }

    // Remove duplicate permission IDs.
    const requestedPermissionIds = [
      ...new Set(dto.permissionIds),
    ];

    // Verify that every requested permission actually exists.
    const permissions =
      await this.teamMemberPermissionRepository.findPermissionsByIds(
        requestedPermissionIds,
      );

    if (
      permissions.length !==
      requestedPermissionIds.length
    ) {
      throw new NotFoundException(
        'One or more permissions were not found',
      );
    }

    // Replace the target member's permissions atomically.
    await this.teamMemberPermissionRepository.replacePermissions(
      targetMember.id,
      requestedPermissionIds,
    );

    const updatedPermissions =
      await this.teamMemberPermissionRepository.findByTeamMember(
        targetMember.id,
      );

    return {
      message: 'Member permissions updated successfully',
      permissions: updatedPermissions,
    };
  }
}