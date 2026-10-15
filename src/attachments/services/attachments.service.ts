import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { AttachmentsRepository } from '../repositories/attachments.repository';
import { fileTypeFromBuffer } from 'file-type';

import { RealtimeService } from '../../common/realtime/realtime.service';
import { REALTIME_EVENTS } from '../../common/realtime-contract/events';
import { taskRoom } from '../../common/realtime-contract/room-helpers';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly realtimeService: RealtimeService,
  ) {}

  async upload(
    teamId: string,
    groupId: string,
    taskId: string,
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
    },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const maxFileSize = 10 * 1024 * 1024;

    if (file.size > maxFileSize) {
      throw new BadRequestException('File size must not exceed 10 MB');
    }

    const task = await this.attachmentsRepository.findTaskInTeam(
      taskId,
      groupId,
      teamId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const detectedType = await fileTypeFromBuffer(file.buffer);
    const mimeType = detectedType?.mime ?? file.mimetype;

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(
        `Unsupported file type: ${mimeType}. Allowed: images, PDF, text, Word, Excel.`,
      );
    }

    const uploadedFile = await this.cloudinaryService.uploadFile(file);

    try {
      const attachment = await this.attachmentsRepository.create(
        taskId,
        uploadedFile.secure_url,
        uploadedFile.public_id,
        mimeType,
        file.size,
      );

      await this.realtimeService.emitToRoom(
        taskRoom(taskId),
        REALTIME_EVENTS.ATTACHMENT_CREATED,
        attachment,
      );

      return attachment;
    } catch (error) {
      try {
        await this.cloudinaryService.deleteFile(
          uploadedFile.public_id,
          mimeType,
        );
      } catch (cleanupError) {
        this.logger.error(
          `Failed to clean up Cloudinary orphan ${uploadedFile.public_id}`,
          cleanupError instanceof Error
            ? cleanupError.stack
            : String(cleanupError),
        );
      }

      throw error;
    }
  }

  async findAll(teamId: string, groupId: string, taskId: string) {
    const task = await this.attachmentsRepository.findTaskInTeam(
      taskId,
      groupId,
      teamId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.attachmentsRepository.findByTask(taskId);
  }

  async findById(
    teamId: string,
    groupId: string,
    taskId: string,
    attachmentId: string,
  ) {
    const attachment = await this.attachmentsRepository.findById(attachmentId);

    if (
      !attachment ||
      attachment.taskId !== taskId ||
      attachment.task.taskGroup.id !== groupId ||
      attachment.task.taskGroup.teamId !== teamId
    ) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  async delete(
    teamId: string,
    groupId: string,
    taskId: string,
    attachmentId: string,
  ) {
    const attachment = await this.findById(
      teamId,
      groupId,
      taskId,
      attachmentId,
    );

    const deletedAttachment =
      await this.attachmentsRepository.delete(attachmentId);

    try {
      await this.cloudinaryService.deleteFile(
        attachment.publicId,
        attachment.mimeType,
      );
    } catch (error) {
      this.logger.error(
        `DB attachment deleted but Cloudinary cleanup failed for ${attachment.publicId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    await this.realtimeService.emitToRoom(
      taskRoom(taskId),
      REALTIME_EVENTS.ATTACHMENT_DELETED,
      {
        attachmentId,
        taskId,
      },
    );

    return deletedAttachment;
  }
}
