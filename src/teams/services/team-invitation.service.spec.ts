import {
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { TeamInvitationService } from './team-invitation.service';
import { UsersRepository } from '../../users/users.repository';
import { TeamsRepository } from '../repositories/teams.repository';
import { TeamInvitationRepository } from '../repositories/team-invitation.repository';
import { MailService } from '../../mail/mail.service';
import { TeamRole } from '../../common/enums/role.enum';

describe('TeamInvitationService', () => {
  let service: TeamInvitationService;
  let teamsRepository: jest.Mocked<TeamsRepository>;
  let usersRepository: jest.Mocked<UsersRepository>;
  let invitationRepository: jest.Mocked<TeamInvitationRepository>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamInvitationService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: TeamsRepository,
          useValue: {
            findById: jest.fn(),
            findMembership: jest.fn(),
          },
        },
        {
          provide: TeamInvitationRepository,
          useValue: {
            findPendingByEmailAndTeam: jest.fn(),
            create: jest.fn(),
            deleteById: jest.fn(),
            findByTokenHash: jest.fn(),
            acceptAndAddMember: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendTeamInvitation: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TeamInvitationService);
    teamsRepository = module.get(TeamsRepository);
    usersRepository = module.get(UsersRepository);
    invitationRepository = module.get(TeamInvitationRepository);
    mailService = module.get(MailService);
  });

  it('deletes invitation and throws when email send fails', async () => {
    teamsRepository.findById.mockResolvedValue({
      id: 'team-1',
      name: 'Engineering',
    } as never);
    usersRepository.findByEmail.mockResolvedValue(null);
    invitationRepository.findPendingByEmailAndTeam.mockResolvedValue(null);
    invitationRepository.create.mockResolvedValue({
      id: 'invite-1',
      email: 'new@example.com',
      role: TeamRole.MEMBER,
      tokenHash: 'hash',
      teamId: 'team-1',
      expiresAt: new Date(),
      acceptedAt: null,
      createdAt: new Date(),
    });
    mailService.sendTeamInvitation.mockRejectedValue(new Error('SMTP down'));

    await expect(
      service.createInvitation('team-1', {
        email: 'new@example.com',
        role: TeamRole.MEMBER,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(invitationRepository.deleteById).toHaveBeenCalledWith('invite-1');
  });

  it('rejects invite when user is already a team member', async () => {
    teamsRepository.findById.mockResolvedValue({
      id: 'team-1',
      name: 'Engineering',
    } as never);
    usersRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'member@example.com',
    } as never);
    teamsRepository.findMembership.mockResolvedValue({
      id: 'member-1',
    } as never);

    await expect(
      service.createInvitation('team-1', {
        email: 'member@example.com',
        role: TeamRole.MEMBER,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
