import { Injectable } from '@nestjs/common';
import { Prisma, RefreshSession } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.RefreshSessionCreateInput,
  ): Promise<RefreshSession> {
    return this.prisma.refreshSession.create({
      data,
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    return this.prisma.refreshSession.findUnique({
      where: {
        tokenHash,
      },
    });
  }

  /**
   * Atomically consumes an active refresh session.
   *
   * Returns true only when this request successfully revoked
   * the session. If another request already revoked it, returns false.
   */
  async consume(id: string): Promise<boolean> {
    const result = await this.prisma.refreshSession.updateMany({
      where: {
        id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return result.count === 1;
  }

  async revoke(id: string): Promise<RefreshSession> {
    return this.prisma.refreshSession.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
