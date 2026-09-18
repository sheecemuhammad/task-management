import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

import { OAuthProfile } from '../interfaces/oauth-profile.interface';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('auth.github.clientId')!,
      clientSecret: configService.get<string>('auth.github.clientSecret')!,
      callbackURL: configService.get<string>('auth.github.callbackUrl')!,
      scope: ['user:email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: OAuthProfile | false) => void,
  ): void {
    const { id, username, displayName, photos, emails } = profile;

    const email = emails?.[0]?.value;

    if (!email) {
      done(null, false);
      return;
    }

    const avatarUrl = photos?.[0]?.value;

    const user: OAuthProfile = {
      provider: 'github',
      providerId: id,
      email,
      name: displayName || username || email,
      avatarUrl,
    };

    done(null, user);
  }
}
