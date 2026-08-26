import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OAuthAccountRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findByProvider(
    provider: string,
    providerId: string,
  ) {
    return this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
    });
  }

  async create(data: {
    provider: string;
    providerId: string;
    userId: string;
  }) {
    return this.prisma.oAuthAccount.create({
      data,
    });
  }
}