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

  async findByTokenHash(
    tokenHash: string,
  ): Promise<RefreshSession | null> {
    return this.prisma.refreshSession.findUnique({
      where: { tokenHash },
    });
  }

  async revoke(id: string): Promise<RefreshSession> {
    return this.prisma.refreshSession.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}