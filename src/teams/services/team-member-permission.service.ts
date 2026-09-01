import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

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
    const requester = await this.teamsRepository.findMembership(
      requesterUserId,
      teamId,
    );

    if (!requester) {
      throw new ForbiddenException('You are not a member of this team');
    }

    if (requester.role === Role.MEMBER) {
      throw new ForbiddenException(
        'You do not have permission to manage member permissions',
      );
    }

    const targetMember = await this.teamsRepository.findTeamMemberById(
      targetMemberId,
      teamId,
    );

    if (!targetMember) {
      throw new NotFoundException('Target team member not found');
    }

    const requestedPermissionIds = [...new Set(dto.permissionIds)];

    const requesterPermissions =
      await this.teamMemberPermissionRepository.findByTeamMember(requester.id);

    const requesterPermissionIds = new Set(
      requesterPermissions.map((item) => item.permissionId),
    );

    const permissions =
      await this.teamMemberPermissionRepository.findPermissionsByIds(
        requestedPermissionIds,
      );

    if (permissions.length !== requestedPermissionIds.length) {
      throw new NotFoundException('One or more permissions were not found');
    }

    if (requester.role === Role.ADMIN) {
      const canAssignAll = requestedPermissionIds.every((permissionId) =>
        requesterPermissionIds.has(permissionId),
      );

      if (!canAssignAll) {
        throw new ForbiddenException(
          'An admin cannot assign permissions they do not have',
        );
      }
    }

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
