import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import ms, { StringValue } from 'ms';

import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RefreshSessionRepository } from './repositories/refresh-session.repository';
import { OAuthAccountRepository } from './repositories/oauth-account.repository';
import { MailService } from '../mail/mail.service';

import { CacheService } from '../common/cache/cache.service';

import type { OAuthProfile } from './interfaces/oauth-profile.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshSessionRepository: RefreshSessionRepository,
    private readonly oauthAccountRepository: OAuthAccountRepository,
    private readonly mailService: MailService,
    private readonly cacheService: CacheService,
  ) {}

  // =====================================================
  // REFRESH TOKEN HELPERS
  // =====================================================

  private generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(user: User) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      systemRole: user.systemRole,
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

  // =====================================================
  // LOCAL LOGIN
  // =====================================================

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

    try {
      await this.mailService.sendLoginSecurityAlert(user.email, user.name);
    } catch (error) {
      console.error('Failed to send login security alert:', error);
    }

    return this.generateTokens(user);
  }

  // =====================================================
  // REFRESH TOKEN
  // =====================================================

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

    // Atomically consume the refresh session.
    // Only one concurrent request can successfully consume it.
    const consumed = await this.refreshSessionRepository.consume(session.id);

    if (!consumed) {
      throw new UnauthorizedException('Refresh token already used');
    }

    return this.generateTokens(user);
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  async logout(refreshToken: string, userId: string) {
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

    // Invalidate all access tokens issued before this logout.
    await this.cacheService.set(`auth:logout:${userId}`, Date.now().toString());

    return {
      message: 'Logged out successfully',
    };
  }

  // =====================================================
  // GOOGLE OAUTH LOGIN
  // =====================================================

  async googleLogin(profile: OAuthProfile) {
    const oauthAccount = await this.oauthAccountRepository.findByProvider(
      profile.provider,
      profile.providerId,
    );

    let user = oauthAccount
      ? await this.usersRepository.findById(oauthAccount.userId)
      : null;

    if (!user) {
      const existingUser = await this.usersRepository.findByEmail(
        profile.email,
      );

      if (existingUser) {
        await this.oauthAccountRepository.create({
          provider: profile.provider,
          providerId: profile.providerId,
          userId: existingUser.id,
        });

        await this.usersRepository.update(existingUser.id, {
          avatarUrl: profile.avatarUrl,
        });

        user = await this.usersRepository.findById(existingUser.id);
      } else {
        const newUser = await this.usersRepository.create({
          name: profile.name,
          email: profile.email,
          password: null,
          avatarUrl: profile.avatarUrl,
        });

        await this.oauthAccountRepository.create({
          provider: profile.provider,
          providerId: profile.providerId,
          userId: newUser.id,
        });

        user = await this.usersRepository.findById(newUser.id);
      }
    }

    if (!user) {
      throw new UnauthorizedException('Unable to create or retrieve user');
    }

    return this.generateTokens(user);
  }

  // =====================================================
  // GITHUB OAUTH LOGIN
  // =====================================================

  async githubLogin(profile: OAuthProfile) {
    const oauthAccount = await this.oauthAccountRepository.findByProvider(
      profile.provider,
      profile.providerId,
    );

    let user = oauthAccount
      ? await this.usersRepository.findById(oauthAccount.userId)
      : null;

    if (!user) {
      const existingUser = await this.usersRepository.findByEmail(
        profile.email,
      );

      if (existingUser) {
        await this.oauthAccountRepository.create({
          provider: profile.provider,
          providerId: profile.providerId,
          userId: existingUser.id,
        });

        await this.usersRepository.update(existingUser.id, {
          avatarUrl: profile.avatarUrl,
        });

        user = await this.usersRepository.findById(existingUser.id);
      } else {
        const newUser = await this.usersRepository.create({
          name: profile.name,
          email: profile.email,
          password: null,
          avatarUrl: profile.avatarUrl,
        });

        await this.oauthAccountRepository.create({
          provider: profile.provider,
          providerId: profile.providerId,
          userId: newUser.id,
        });

        user = await this.usersRepository.findById(newUser.id);
      }
    }

    if (!user) {
      throw new UnauthorizedException('Unable to create or retrieve user');
    }

    return this.generateTokens(user);
  }
}
