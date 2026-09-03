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
import appConfig from './lib/shared/config/app.config';
import databaseConfig from './lib/shared/config/database.config';
import authConfig from './lib/shared/config/auth.config';
import mailConfig from './lib/shared/config/mail.config';


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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
