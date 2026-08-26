import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RefreshSessionRepository } from './repositories/refresh-session.repository';
import { OAuthAccountRepository } from './repositories/oauth-account.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,

    private readonly refreshSessionRepository: RefreshSessionRepository,

    private readonly oauthAccountRepository: OAuthAccountRepository,
  ) {}

  // Generate a random refresh token and return it as a string

  private generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  // Hash the refresh token using SHA-256
  // and return the hash as a string

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // LOCAL LOGIN

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

  // REFRESH TOKEN

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

    // Revoke old refresh session
    await this.refreshSessionRepository.revoke(session.id);

    // Create new refresh session
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

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

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

  // GOOGLE OAUTH LOGIN

  async googleLogin(profile: {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }) {
    // Check whether this Google account
    // is already linked to a user.

    const oauthAccount = await this.oauthAccountRepository.findByProvider(
      profile.provider,
      profile.providerId,
    );

    let user = oauthAccount
      ? await this.usersRepository.findById(oauthAccount.userId)
      : null;

    // OAuth account doesn't exist yet.
    if (!user) {
      // Check whether a local user already
      // exists with the same confirmed email.

      const existingUser = await this.usersRepository.findByEmail(
        profile.email,
      );

      if (existingUser) {
        // Link Google account to existing user.

        await this.oauthAccountRepository.create({
          provider: profile.provider,

          providerId: profile.providerId,

          userId: existingUser.id,
        });

        // Update profile image if available.

        await this.usersRepository.update(existingUser.id, {
          avatarUrl: profile.avatarUrl,
        });

        user = await this.usersRepository.findById(existingUser.id);
      } else {
        // Create a new OAuth user.

        const newUser = await this.usersRepository.create({
          name: profile.name,

          email: profile.email,

          password: null,

          avatarUrl: profile.avatarUrl,
        });

        // Link Google account to new user.

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

    // Generate application access token.

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    // Generate application refresh token.

    const refreshToken = this.generateRefreshToken();

    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    const refreshTokenExpiresIn =
      this.configService.get<string>('auth.refreshTokenExpiresIn') ?? '7d';

    const expiresAt = new Date(
      Date.now() + ms(refreshTokenExpiresIn as StringValue),
    );

    // Store refresh session.

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

  // GITHUB OAUTH LOGIN

  async githubLogin(profile: {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }) {
    // Check whether this GitHub account
    // is already linked to a user.

    const oauthAccount = await this.oauthAccountRepository.findByProvider(
      profile.provider,
      profile.providerId,
    );

    let user = oauthAccount
      ? await this.usersRepository.findById(oauthAccount.userId)
      : null;

    // OAuth account doesn't exist yet.
    if (!user) {
      // Check whether a user already exists
      // with the same confirmed email.

      const existingUser = await this.usersRepository.findByEmail(
        profile.email,
      );

      if (existingUser) {
        // Link GitHub account to existing user.

        await this.oauthAccountRepository.create({
          provider: profile.provider,

          providerId: profile.providerId,

          userId: existingUser.id,
        });

        // Update profile image if available.

        await this.usersRepository.update(existingUser.id, {
          avatarUrl: profile.avatarUrl,
        });

        user = await this.usersRepository.findById(existingUser.id);
      } else {
        // Create a new OAuth user.

        const newUser = await this.usersRepository.create({
          name: profile.name,

          email: profile.email,

          password: null,

          avatarUrl: profile.avatarUrl,
        });

        // Link GitHub account to new user.

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

    // Generate application access token.

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    // Generate application refresh token.

    const refreshToken = this.generateRefreshToken();

    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    const refreshTokenExpiresIn =
      this.configService.get<string>('auth.refreshTokenExpiresIn') ?? '7d';

    const expiresAt = new Date(
      Date.now() + ms(refreshTokenExpiresIn as StringValue),
    );

    // Store refresh session.

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
