import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtStrategy } from './jwt.strategy';
import { RefreshSessionRepository } from '../repositories/refresh-session.repository';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let refreshSessionRepository: jest.Mocked<RefreshSessionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: RefreshSessionRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
    refreshSessionRepository = module.get(RefreshSessionRepository);
  });

  it('rejects when session user does not match token subject', async () => {
    refreshSessionRepository.findById.mockResolvedValue({
      id: 'session-1',
      tokenHash: 'hash',
      userId: 'other-user',
      deviceId: null,
      ipAddress: null,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user@example.com',
        systemRole: 'USER',
        sessionId: 'session-1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts a valid active session', async () => {
    refreshSessionRepository.findById.mockResolvedValue({
      id: 'session-1',
      tokenHash: 'hash',
      userId: 'user-1',
      deviceId: null,
      ipAddress: null,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user@example.com',
        systemRole: 'USER',
        sessionId: 'session-1',
      }),
    ).resolves.toEqual({
      userId: 'user-1',
      email: 'user@example.com',
      systemRole: 'USER',
      sessionId: 'session-1',
    });
  });
});
