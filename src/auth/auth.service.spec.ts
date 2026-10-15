import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { RefreshSessionRepository } from './repositories/refresh-session.repository';
import { OAuthAccountRepository } from './repositories/oauth-account.repository';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let refreshSessionRepository: jest.Mocked<RefreshSessionRepository>;
  let oauthAccountRepository: jest.Mocked<OAuthAccountRepository>;
  let mailService: jest.Mocked<MailService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('access-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'auth.refreshTokenExpiresIn') return '7d';
              return undefined;
            }),
          },
        },
        {
          provide: RefreshSessionRepository,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'session-1' }),
            findByTokenHash: jest.fn(),
            consume: jest.fn(),
            revoke: jest.fn(),
          },
        },
        {
          provide: OAuthAccountRepository,
          useValue: {
            findByProvider: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendLoginSecurityAlert: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersRepository = module.get(UsersRepository);
    refreshSessionRepository = module.get(RefreshSessionRepository);
    oauthAccountRepository = module.get(OAuthAccountRepository);
    mailService = module.get(MailService);
    jwtService = module.get(JwtService);
  });

  it('rejects OAuth login when email already belongs to a local account', async () => {
    oauthAccountRepository.findByProvider.mockResolvedValue(null);
    usersRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'existing@example.com',
      name: 'Existing',
      password: 'hash',
      avatarUrl: null,
      systemRole: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.googleLogin({
        provider: 'google',
        providerId: 'g-1',
        email: 'existing@example.com',
        name: 'Existing',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(oauthAccountRepository.create).not.toHaveBeenCalled();
  });

  it('continues login when security alert email fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require('bcrypt') as typeof import('bcrypt');
    const password = bcrypt.hashSync('Password1!', 4);

    usersRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      password,
      avatarUrl: null,
      systemRole: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mailService.sendLoginSecurityAlert.mockRejectedValue(new Error('SMTP down'));

    const result = await service.login(
      {
        email: 'user@example.com',
        password: 'Password1!',
        deviceId: 'device-1',
      },
      '127.0.0.1',
    );

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBeDefined();
    expect(jwtService.signAsync).toHaveBeenCalled();
  });

  it('throws when refresh token was already consumed', async () => {
    refreshSessionRepository.findByTokenHash.mockResolvedValue({
      id: 'session-old',
      tokenHash: 'hash',
      userId: 'user-1',
      deviceId: 'device-1',
      ipAddress: null,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
    });
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      password: 'hash',
      avatarUrl: null,
      systemRole: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    refreshSessionRepository.create.mockResolvedValue({
      id: 'session-new',
      tokenHash: 'new-hash',
      userId: 'user-1',
      deviceId: 'device-1',
      ipAddress: null,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
    });
    refreshSessionRepository.consume.mockResolvedValue(false);
    refreshSessionRepository.findByTokenHash
      .mockResolvedValueOnce({
        id: 'session-old',
        tokenHash: 'hash',
        userId: 'user-1',
        deviceId: 'device-1',
        ipAddress: null,
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        createdAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: 'session-new',
        tokenHash: 'new-hash',
        userId: 'user-1',
        deviceId: 'device-1',
        ipAddress: null,
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        createdAt: new Date(),
      });

    await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(refreshSessionRepository.revoke).toHaveBeenCalledWith('session-new');
  });
});
