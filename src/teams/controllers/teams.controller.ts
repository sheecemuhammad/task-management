import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TeamsService } from '../teams.service';
import { CreateTeamDto } from '../dto/create-team.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  async create(@Body() createTeamDto: CreateTeamDto, @Req() req: any) {
    return this.teamsService.create(createTeamDto, req.user.userId);
  }

  @Get(':teamId')
  async findById(@Param('teamId') teamId: string) {
    return this.teamsService.findById(teamId);
  }
}
