import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { AttachmentsService } from '../services/attachments.service';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../teams/guards/permissions.guard';
import { Permissions } from '../../teams/decorators/permissions.decorator';

@Controller('teams')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post(':teamId/task-groups/:groupId/tasks/:taskId/attachments')
  @Permissions('task:update')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @UploadedFile()
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
    },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.attachmentsService.upload(teamId, groupId, taskId, file);
  }

  @Get(':teamId/task-groups/:groupId/tasks/:taskId/attachments')
  @Permissions('task:view')
  async findAll(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.attachmentsService.findAll(teamId, groupId, taskId);
  }

  @Get(':teamId/task-groups/:groupId/tasks/:taskId/attachments/:attachmentId')
  @Permissions('task:view')
  async findById(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('attachmentId', ParseUUIDPipe)
    attachmentId: string,
  ) {
    return this.attachmentsService.findById(
      teamId,
      groupId,
      taskId,
      attachmentId,
    );
  }

  @Delete(
    ':teamId/task-groups/:groupId/tasks/:taskId/attachments/:attachmentId',
  )
  @Permissions('task:update')
  async delete(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('attachmentId', ParseUUIDPipe)
    attachmentId: string,
  ) {
    return this.attachmentsService.delete(
      teamId,
      groupId,
      taskId,
      attachmentId,
    );
  }
}
