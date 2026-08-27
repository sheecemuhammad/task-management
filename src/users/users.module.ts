import { Module } from '@nestjs/common';

import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UsersController } from './controllers/users.controller';

import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],

  providers: [
    UsersRepository,
    UsersService,
  ],

  exports: [
    UsersRepository,
    UsersService,
  ],

  controllers: [
    UsersController,
  ],
})
export class UsersModule {}