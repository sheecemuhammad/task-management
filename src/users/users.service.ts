import {
  ConflictException,
  Injectable,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { User } from '@prisma/client';

import { CreateUserDto } from './dto/create-user.dto';

import { UsersRepository } from './users.repository';

import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,

    private readonly mailService: MailService,
  ) {}

  async findById(
    id: string,
  ): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findByEmail(
    email: string,
  ): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async create(
    createUserDto: CreateUserDto,
  ) {
    const existingUser =
      await this.usersRepository.findByEmail(
        createUserDto.email,
      );

    if (existingUser) {
      throw new ConflictException(
        'Email already registered',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        createUserDto.password,
        12,
      );

    const user =
      await this.usersRepository.create({
        name: createUserDto.name,

        email: createUserDto.email,

        password: hashedPassword,
      });

    // Send welcome email after successful registration

    await this.mailService.sendWelcomeEmail(
      user.email,
      user.name,
    );

    return user;
  }
}