import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './controllers/auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshSessionRepository } from './repositories/refresh-session.repository';
import { StringValue } from 'ms';

@Module({
  imports: [
    UsersModule,

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
  RefreshSessionRepository,
],
})
export class AuthModule {}
