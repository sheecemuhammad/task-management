import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { AttachmentsRepository } from '../repositories/attachments.repository';
import { fileTypeFromBuffer } from 'file-type';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly attachmentsRepository: AttachmentsRepository,
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

    // 10 MB maximum file size
    const maxFileSize = 10 * 1024 * 1024;

    if (file.size > maxFileSize) {
      throw new BadRequestException('File size must not exceed 10 MB');
    }

    // Verify that task belongs to the requested group and team
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        groupId,
        taskGroup: {
          teamId,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Detect the actual file MIME type
    const detectedType = await fileTypeFromBuffer(file.buffer);

    const mimeType = detectedType?.mime ?? file.mimetype;

    // Upload file to Cloudinary
    const uploadedFile = await this.cloudinaryService.uploadFile(file);

    // Save Cloudinary metadata in PostgreSQL
    return this.attachmentsRepository.create(
      taskId,
      uploadedFile.secure_url,
      uploadedFile.public_id,
      mimeType,
      file.size,
    );
  }

  async findAll(teamId: string, groupId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        groupId,
        taskGroup: {
          teamId,
        },
      },
    });

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

    // Delete from Cloudinary first
    await this.cloudinaryService.deleteFile(
      attachment.publicId,
      attachment.mimeType,
    );

    // Then delete database record
    return this.attachmentsRepository.delete(attachmentId);
  }
}
