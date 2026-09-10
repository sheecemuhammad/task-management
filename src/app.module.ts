import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { TeamsModule } from './teams/teams.module';
import { TaskGroupsModule } from './task-groups/task-groups.module';
import { TasksModule } from './tasks/tasks.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { CommentsModule } from './comments/comments.module';
import { CacheModule } from './common/cache/cache.module';
import { RealtimeModule } from './common/realtime/realtime.module';
import appConfig from './common/config/app.config';
import databaseConfig from './common/config/database.config';
import authConfig from './common/config/auth.config';
import mailConfig from './common/config/mail.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, mailConfig],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    MailModule,
    TeamsModule,
    TaskGroupsModule,
    TasksModule,
    CloudinaryModule,
    AttachmentsModule,
    CommentsModule,
    CacheModule,
    RealtimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
