import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { AttachmentsRepository } from '../repositories/attachments.repository';
import { fileTypeFromBuffer } from 'file-type';

import { RealtimeService } from '../../common/realtime/realtime.service';
import { REALTIME_EVENTS } from '../../common/realtime-contract/events';
import { taskRoom } from '../../common/realtime-contract/room-helpers';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly realtimeService: RealtimeService,
  ) {}

  // =====================================================
  // Upload Attachment
  // =====================================================

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

    // 10 MB maximum file size
    const maxFileSize = 10 * 1024 * 1024;

    if (file.size > maxFileSize) {
      throw new BadRequestException('File size must not exceed 10 MB');
    }

    // ===================================================
    // Verify Task
    // ===================================================

    const task = await this.attachmentsRepository.findTaskInTeam(
      taskId,
      groupId,
      teamId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // ===================================================
    // Detect Actual File MIME Type
    // ===================================================

    const detectedType = await fileTypeFromBuffer(file.buffer);

    const mimeType = detectedType?.mime ?? file.mimetype;

    // ===================================================
    // Upload To Cloudinary
    // ===================================================

    const uploadedFile = await this.cloudinaryService.uploadFile(file);

    // ===================================================
    // Save Attachment In PostgreSQL
    // ===================================================

    const attachment = await this.attachmentsRepository.create(
      taskId,
      uploadedFile.secure_url,
      uploadedFile.public_id,
      mimeType,
      file.size,
    );

    // ===================================================
    // Realtime Event
    // ===================================================

    await this.realtimeService.emitToRoom(
      taskRoom(taskId),
      REALTIME_EVENTS.ATTACHMENT_CREATED,
      attachment,
    );

    return attachment;
  }

  // =====================================================
  // Find All Attachments
  // =====================================================

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

  // =====================================================
  // Find Attachment By ID
  // =====================================================

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

  // =====================================================
  // Delete Attachment
  // =====================================================

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

    // ===================================================
    // Delete From Cloudinary
    // ===================================================

    await this.cloudinaryService.deleteFile(
      attachment.publicId,
      attachment.mimeType,
    );

    // ===================================================
    // Delete Database Record
    // ===================================================

    const deletedAttachment =
      await this.attachmentsRepository.delete(attachmentId);

    // ===================================================
    // Realtime Event
    // ===================================================

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
