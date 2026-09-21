import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import type { OAuthProfile } from '../interfaces/oauth-profile.interface';

@Injectable()
export class OAuthAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProvider(provider: OAuthProfile['provider'], providerId: string) {
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
    provider: OAuthProfile['provider'];
    providerId: string;
    userId: string;
  }) {
    return this.prisma.oAuthAccount.create({
      data,
    });
  }
}
