import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ description: '帖子标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '帖子内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '图片列表', type: [String] })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: '用户ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: '话题分类', required: false })
  @IsOptional()
  @IsString()
  topic?: string;
}

export class UpdatePostDto extends CreatePostDto {}

export class QueryPostDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  pageSize?: number;

  @ApiProperty({ description: '话题分类', required: false })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '排序字段', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: '排序方向',
    required: false,
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({ description: '社区ID', required: false })
  @IsOptional()
  @IsString()
  communityId?: string;
}
