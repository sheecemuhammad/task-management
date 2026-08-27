import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TeamsRepository } from './repositories/teams.repository';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamsRepository: TeamsRepository,
  ) {}

  async create(
    createTeamDto: CreateTeamDto,
    userId: string,
  ) {
    return this.teamsRepository.createTeamWithOwner(
      createTeamDto.name,
      userId,
    );
  }

  async findById(teamId: string) {
    const team = await this.teamsRepository.findById(teamId);

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }
}