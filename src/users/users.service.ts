import { ConflictException, Injectable, Logger } from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { User } from '@prisma/client';

import { CreateUserDto } from './dto/create-user.dto';

import { UsersRepository } from './users.repository';

import { MailService } from '../mail/mail.service';

type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly mailService: MailService,
  ) {}

  async findById(id: string): Promise<SafeUser | null> {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    return this.usersRepository.findByEmail(email);
  }

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const email = createUserDto.email.trim().toLowerCase();

    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const user = await this.usersRepository.create({
      name: createUserDto.name,
      email,
      password: hashedPassword,
    });

    try {
      await this.mailService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${user.email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return user;
  }
}
