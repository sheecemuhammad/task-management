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

  // Generate a random refresh token and return it as a string

  private generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  // Hash the refresh token using SHA-256 and return the hash as a string

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Login method to authenticate user and generate access and refresh tokens

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

    const expiresAt = new Date(
      Date.now() + ms(refreshTokenExpiresIn as StringValue),
    );

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

  // Refresh method to generate new access and refresh tokens

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);

    const session =
      await this.refreshSessionRepository.findByTokenHash(tokenHash);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersRepository.findById(session.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    const newRefreshToken = this.generateRefreshToken();

    const newRefreshTokenHash = this.hashRefreshToken(newRefreshToken);

    const refreshTokenExpiresIn =
      this.configService.get<string>('auth.refreshTokenExpiresIn') ?? '7d';

    const newExpiresAt = new Date(
      Date.now() + ms(refreshTokenExpiresIn as StringValue),
    );

    await this.refreshSessionRepository.revoke(session.id);

    await this.refreshSessionRepository.create({
      tokenHash: newRefreshTokenHash,
      expiresAt: newExpiresAt,
      user: {
        connect: {
          id: user.id,
        },
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  //Logout method to revoke the refresh token

  async logout(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);

    const session =
      await this.refreshSessionRepository.findByTokenHash(tokenHash);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.revokedAt) {
      return {
        message: 'Already logged out',
      };
    }

    await this.refreshSessionRepository.revoke(session.id);

    return {
      message: 'Logged out successfully',
    };
  }
}
