import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { StringValue } from 'ms';

import { AuthService } from './auth.service';
import { AuthController } from './controllers/auth.controller';

import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleAuthGuard } from './guards/google-auth.guard';

import { GithubStrategy } from './strategies/github.strategy';
import { GithubAuthGuard } from './guards/github-auth.guard';

import { RefreshSessionRepository } from './repositories/refresh-session.repository';
import { OAuthAccountRepository } from './repositories/oauth-account.repository';

@Module({
  imports: [
    UsersModule,
    MailModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret'),

        signOptions: {
          expiresIn: (configService.get<string>('auth.accessTokenExpiresIn') ??
            '15m') as StringValue,
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,

    JwtStrategy,
    JwtAuthGuard,

    GoogleStrategy,
    GoogleAuthGuard,

    GithubStrategy,
    GithubAuthGuard,

    RefreshSessionRepository,
    OAuthAccountRepository,
  ],

  exports: [JwtModule],
})
export class AuthModule {}
