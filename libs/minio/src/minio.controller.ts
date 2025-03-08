import {
  Controller,
  Get,
  Post,
  Query,
  Inject,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MINIO_CLIENT } from './minio.constants';
import { MinioService } from './minio.service';
import * as Minio from 'minio';
import { ResultData } from '@app/common';

@Controller('minio')
@ApiTags('minio')
export class MinioController {
  constructor(
    private readonly minioService: MinioService,
    @Inject(MINIO_CLIENT) private readonly minioClient: Minio.Client,
  ) {}

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
      return ResultData.fail(500, '获取上传链接失败: ' + error.message);
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
      return ResultData.fail(500, '获取访问链接失败: ' + error.message);
    }
  }

  @Post('upload')
  @ApiOperation({ summary: '单文件上传' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: '.(png|jpeg|jpg|gif|pdf|doc|docx|xls|xlsx|txt)',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const url = await this.minioService.uploadFile(file);
      return ResultData.ok({ url }, '文件上传成功');
    } catch (error) {
      return ResultData.fail(500, '文件上传失败: ' + error.message);
    }
  }

  @Post('upload/multiple')
  @ApiOperation({ summary: '多文件上传' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // 最多上传10个文件
  async uploadMultipleFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: '.(png|jpeg|jpg|gif|pdf|doc|docx|xls|xlsx|txt)',
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    try {
      const urls = await this.minioService.uploadFiles(files);
      return ResultData.ok({ urls }, '文件上传成功');
    } catch (error) {
      return ResultData.fail(500, '文件上传失败: ' + error.message);
    }
  }
}
