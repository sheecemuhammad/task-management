import {
  Body,
  Controller,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TeamRole } from '../../lib/shared/enums/role.enum';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TeamMemberPermissionService } from '../services/team-member-permission.service';
import { UpdateMemberPermissionsDto } from '../dto/update-member-permissions.dto';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamMemberPermissionController {
  constructor(
    private readonly teamMemberPermissionService: TeamMemberPermissionService,
  ) {}

  @Put(':teamId/members/:memberId/permissions')
  @UseGuards(RolesGuard)
  @Roles(TeamRole.ADMIN)
  async updatePermissions(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberPermissionsDto,
    @Req() req: any,
  ) {
    return this.teamMemberPermissionService.updateMemberPermissions(
      req.user.userId,
      teamId,
      memberId,
      dto,
    );
  }
}