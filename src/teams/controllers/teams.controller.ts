import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TeamsService } from '../teams.service';
import { CreateTeamDto } from '../dto/create-team.dto';
import { UpdateMemberRoleDto } from '../dto/update-member-role.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TeamRole } from '../../lib/shared/enums/role.enum';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  async create(@Body() createTeamDto: CreateTeamDto, @Req() req: any) {
    return this.teamsService.create(createTeamDto, req.user.userId);
  }

  @Get(':teamId')
  async findById(@Param('teamId') teamId: string, @Req() req: any) {
    return this.teamsService.findById(teamId, req.user.userId);
  }

  @Patch(':teamId/members/:memberId/role')
  @UseGuards(RolesGuard)
  @Roles(TeamRole.ADMIN)
  async updateMemberRole(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: any,
  ) {
    return this.teamsService.updateMemberRole(
      req.user.userId,
      teamId,
      memberId,
      dto,
    );
  }
}
