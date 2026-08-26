import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(
  Strategy,
  'github',
) {
  constructor(
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>(
        'auth.github.clientId',
      )!,
      clientSecret: configService.get<string>(
        'auth.github.clientSecret',
      )!,
      callbackURL: configService.get<string>(
        'auth.github.callbackUrl',
      )!,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ) {
    const { id, username, displayName, photos, emails } =
      profile;

    const email = emails?.[0]?.value;

    if (!email) {
      return done(null, false);
    }

    const avatarUrl = photos?.[0]?.value;

    const user = {
      provider: 'github',
      providerId: id,
      email,
      name: displayName || username || email,
      avatarUrl,
    };

    done(null, user);
  }
}