import { Injectable } from '@nestjs/common';

import { FeatureRepository } from '../repositories/feature.repository';

@Injectable()
export class FeatureService {
  constructor(
    private readonly featureRepository: FeatureRepository,
  ) {}

  async findAllWithPermissions() {
    return this.featureRepository.findAllWithPermissions();
  }
}