import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { FeatureService } from '../services/feature.service';

@Controller('teams/features')
@UseGuards(JwtAuthGuard)
export class FeatureController {
  constructor(
    private readonly featureService: FeatureService,
  ) {}

  @Get('permissions')
  async findAllWithPermissions() {
    return this.featureService.findAllWithPermissions();
  }
}