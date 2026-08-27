import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { TeamsModule } from './teams/teams.module';
import appConfig from './lib/shared/config/app.config';
import databaseConfig from './lib/shared/config/database.config';
import authConfig from './lib/shared/config/auth.config';
import mailConfig from './lib/shared/config/mail.config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, mailConfig],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    MailModule,
    TeamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
