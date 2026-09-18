import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

import { OAuthProfile } from '../interfaces/oauth-profile.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('auth.google.clientId')!,
      clientSecret: configService.get<string>('auth.google.clientSecret')!,
      callbackURL: configService.get<string>('auth.google.callbackUrl')!,
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, name, emails, photos } = profile;

    const email = emails?.[0]?.value;
    const emailVerified = emails?.[0]?.verified;

    if (!email || !emailVerified) {
      done(null, false);
      return;
    }

    const avatarUrl = photos?.[0]?.value;

    const user: OAuthProfile = {
      provider: 'google',
      providerId: id,
      email,
      name: name?.givenName
        ? `${name.givenName} ${name.familyName ?? ''}`.trim()
        : email,
      avatarUrl,
    };

    done(null, user);
  }
}
