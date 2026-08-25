import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';

import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RefreshSessionRepository } from './repositories/refresh-session.repository';
@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshSessionRepository: RefreshSessionRepository,
  ) {}

  private generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password ?? '',
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = this.generateRefreshToken();

    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    const refreshTokenExpiresIn =
      this.configService.get<string>('auth.refreshTokenExpiresIn') ?? '7d';

    const expiresAt = new Date(Date.now() + ms(refreshTokenExpiresIn as StringValue));

    await this.refreshSessionRepository.create({
      tokenHash: refreshTokenHash,
      expiresAt,
      user: {
        connect: {
          id: user.id,
        },
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
