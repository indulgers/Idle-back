import { Inject, Injectable } from '@nestjs/common';
import { MINIO_CLIENT } from './minio.constants';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
  constructor(
    @Inject(MINIO_CLIENT)
    private readonly minioClient: Minio.Client,
  ) {}

  // 确保bucket存在
  async ensureBucketExists(bucketName: string = 'idle'): Promise<void> {
    const bucketExists = await this.minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await this.minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`创建 bucket: ${bucketName}`);

      // 设置bucket策略为公共读取(可选)
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };

      await this.minioClient.setBucketPolicy(
        bucketName,
        JSON.stringify(policy),
      );
    }
  }

  // 上传文件到MinIO
  async uploadFile(
    file: Express.Multer.File,
    bucketName: string = 'idle',
  ): Promise<string> {
    try {
      // 确保bucket存在
      await this.ensureBucketExists(bucketName);

      // 生成唯一文件名
      const uniqueFileName = `${Date.now()}-${file.originalname}`;

      // 上传文件
      await this.minioClient.putObject(
        bucketName,
        uniqueFileName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      // 生成访问URL
      const url = await this.minioClient.presignedGetObject(
        bucketName,
        uniqueFileName,
        24 * 60 * 60, // 24小时有效
      );

      return url;
    } catch (error) {
      console.error('上传文件到MinIO失败:', error);
      throw error;
    }
  }

  // 上传多个文件到MinIO
  async uploadFiles(
    files: Express.Multer.File[],
    bucketName: string = 'idle',
  ): Promise<string[]> {
    const urls: string[] = [];

    for (const file of files) {
      const url = await this.uploadFile(file, bucketName);
      urls.push(url);
    }

    return urls;
  }

  // 获取文件访问URL
  async getFileUrl(
    fileName: string,
    bucketName: string = 'idle',
  ): Promise<string> {
    return await this.minioClient.presignedGetObject(
      bucketName,
      fileName,
      24 * 60 * 60, // 24小时有效
    );
  }
}
