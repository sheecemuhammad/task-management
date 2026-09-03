import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    taskId: string,
    url: string,
    publicId: string,
    mimeType: string,
    size: number,
  ) {
    return this.prisma.attachment.create({
      data: {
        taskId,
        url,
        publicId,
        mimeType,
        size,
      },
    });
  }

  async findByTask(taskId: string) {
    return this.prisma.attachment.findMany({
      where: {
        taskId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(attachmentId: string) {
    return this.prisma.attachment.findUnique({
      where: {
        id: attachmentId,
      },
      include: {
        task: {
          include: {
            taskGroup: true,
          },
        },
      },
    });
  }

  async delete(attachmentId: string) {
    return this.prisma.attachment.delete({
      where: {
        id: attachmentId,
      },
    });
  }
}