import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MINIO_CLIENT } from './minio.module';
import * as Minio from 'minio';
import { ResultData } from '@app/common';

@Controller('minio')
@ApiTags('minio')
export class MinioController {
  @Inject(MINIO_CLIENT)
  private minioClient: Minio.Client;

  @Get('presigned')
  @ApiOperation({ summary: '获取预签名上传URL' })
  @ApiQuery({ name: 'name', required: true, description: '文件名' })
  async getPresignedUrl(@Query('name') name: string) {
    try {
      const bucketName = 'idle';

      // 确保 bucket 存在
      const bucketExists = await this.minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(bucketName);
        console.log(`创建 bucket: ${bucketName}`);
      }

      // 生成预签名上传 URL（1小时有效）
      const url = await this.minioClient.presignedPutObject(
        bucketName,
        name,
        3600,
      );

      return ResultData.ok(url, '获取上传链接成功');
    } catch (error) {
      return ResultData.error('获取上传链接失败', error.message);
    }
  }

  @Get('url')
  @ApiOperation({ summary: '获取文件访问URL' })
  @ApiQuery({ name: 'name', required: true, description: '文件名' })
  async getFileUrl(@Query('name') name: string) {
    try {
      const bucketName = 'idle';
      // 生成预签名下载 URL（24小时有效）
      const url = await this.minioClient.presignedGetObject(
        bucketName,
        name,
        24 * 60 * 60,
      );

      return ResultData.ok(url, '获取访问链接成功');
    } catch (error) {
      return ResultData.error('获取访问链接失败', error.message);
    }
  }
}
