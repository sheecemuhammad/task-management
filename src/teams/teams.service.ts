import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  SystemRole,
  TeamRole,
} from '../lib/shared/enums/role.enum';

import { TeamsRepository } from './repositories/teams.repository';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamsRepository: TeamsRepository,
  ) {}

  async create(
    createTeamDto: CreateTeamDto,
    userId: string,
  ) {
    return this.teamsRepository.createTeamWithAdmin(
      createTeamDto.name,
      userId,
    );
  }

  async findById(
    teamId: string,
    userId: string,
  ) {
    const team = await this.teamsRepository.findById(teamId);

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const user =
      await this.teamsRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    // Global OWNER can access any team.
    if (user.systemRole === SystemRole.OWNER) {
      return team;
    }

    // Normal users must belong to the team.
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

    return team;
  }

  async updateMemberRole(
    requesterUserId: string,
    teamId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const requester =
      await this.teamsRepository.findUserById(
        requesterUserId,
      );

    if (!requester) {
      throw new NotFoundException(
        'Requester user not found',
      );
    }

    // Global OWNER can manage roles in any team.
    if (requester.systemRole !== SystemRole.OWNER) {
      const membership =
        await this.teamsRepository.findMembership(
          requesterUserId,
          teamId,
        );

      if (!membership) {
        throw new ForbiddenException(
          'You are not a member of this team',
        );
      }

      if (membership.role !== TeamRole.ADMIN) {
        throw new ForbiddenException(
          'You do not have permission to manage member roles',
        );
      }
    }

    // Make sure the target member belongs to this team.
    const targetMember =
      await this.teamsRepository.findTeamMemberById(
        memberId,
        teamId,
      );

    if (!targetMember) {
      throw new NotFoundException(
        'Target team member not found',
      );
    }

    const result =
      await this.teamsRepository.updateMemberRole(
        memberId,
        teamId,
        dto.role,
      );

    if (result.count === 0) {
      throw new NotFoundException(
        'Target team member not found',
      );
    }

    return {
      message: 'Member role updated successfully',
      memberId,
      teamId,
      role: dto.role,
    };
  }
}