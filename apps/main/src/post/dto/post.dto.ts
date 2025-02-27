import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

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
}

export class UpdatePostDto extends CreatePostDto {}

export class QueryPostDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  pageSize?: number;
}
