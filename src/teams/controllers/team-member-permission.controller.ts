import { Body, Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { TeamRole } from '../../common/enums/role.enum';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TeamMemberPermissionService } from '../services/team-member-permission.service';
import { UpdateMemberPermissionsDto } from '../dto/update-member-permissions.dto';
interface AuthenticatedUser {
  userId: string;
}
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
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
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamMemberPermissionService.updateMemberPermissions(
      req.user.userId,
      teamId,
      memberId,
      dto,
    );
  }
}
