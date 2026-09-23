import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { RefreshSessionRepository } from '../repositories/refresh-session.repository';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly refreshSessionRepository: RefreshSessionRepository,
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
    const session = await this.refreshSessionRepository.findById(
      payload.sessionId,
    );

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Session revoked');
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      systemRole: payload.systemRole,
      sessionId: payload.sessionId,
    };
  }
}
