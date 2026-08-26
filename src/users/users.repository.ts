import { Injectable } from '@nestjs/common';

import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Find a user by their unique ID

  async findById(
    id: string,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // Find a user by their email address

  async findByEmail(
    email: string,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Create a new user in the database
  // Password is intentionally excluded from the response

  async create(
    data: Prisma.UserCreateInput,
  ): Promise<Omit<User, 'password'>> {
    return this.prisma.user.create({
      data,

      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Update an existing user
  // Password is intentionally excluded from the response

  async update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<Omit<User, 'password'>> {
    return this.prisma.user.update({
      where: { id },

      data,

      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}