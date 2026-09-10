import { Module } from '@nestjs/common';

import { CommentsController } from './controllers/comments.controller';

import { CommentsRepository } from './repositories/comments.repository';

import { CommentsService } from './services/comments.service';

import { PrismaService } from '../prisma/prisma.service';

import { TeamsModule } from '../teams/teams.module';

import { AuthModule } from '../auth/auth.module';

import { CommentsGateway } from '../common/realtime/comments.gateway';

import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TeamsModule, AuthModule, RedisModule],

  controllers: [CommentsController],

  providers: [
    CommentsService,
    CommentsRepository,
    PrismaService,
    CommentsGateway,
  ],
})
export class CommentsModule {}
