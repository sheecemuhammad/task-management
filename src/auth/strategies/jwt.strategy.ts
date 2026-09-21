import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { CacheService } from '../../common/cache/cache.service';

import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    const jwtSecret = configService.get<string>('auth.jwtSecret');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const logoutTimestamp = await this.cacheService.get<string>(
      `auth:logout:${payload.sub}`,
    );

    if (logoutTimestamp && payload.iat) {
      const logoutTime = Number(logoutTimestamp);
      const tokenIssuedAt = payload.iat * 1000;

      if (tokenIssuedAt <= logoutTime) {
        throw new UnauthorizedException('Access token revoked');
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      systemRole: payload.systemRole,
    };
  }
}