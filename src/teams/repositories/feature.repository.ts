import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeatureRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllWithPermissions() {
    return this.prisma.feature.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        permissions: {
          orderBy: {
            name: 'asc',
          },
        },
      },
    });
  }
}