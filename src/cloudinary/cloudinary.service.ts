import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadFile(file: { buffer: Buffer }): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'task-management',
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(new Error('Cloudinary upload failed'));
            return;
          }

          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }
  async deleteFile(publicId: string, mimeType: string): Promise<void> {
    const resourceType = mimeType.startsWith('image/')
      ? 'image'
      : mimeType.startsWith('video/')
        ? 'video'
        : 'raw';

    await new Promise<void>((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (result?.result !== 'ok' && result?.result !== 'not found') {
            reject(new Error(`Cloudinary deletion failed: ${result?.result}`));
            return;
          }

          resolve();
        },
      );
    });
  }
}
