import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // FIND USER
  // =====================================================

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // =====================================================
  // CREATE USER
  // =====================================================

  async create(data: Prisma.UserCreateInput): Promise<SafeUser> {
    return this.prisma.user.create({
      data,

      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        systemRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // =====================================================
  // UPDATE USER
  // =====================================================

  async update(id: string, data: Prisma.UserUpdateInput): Promise<SafeUser> {
    return this.prisma.user.update({
      where: { id },

      data,

      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        systemRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
