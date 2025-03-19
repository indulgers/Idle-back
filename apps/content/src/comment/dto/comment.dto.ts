import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: '评论内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '用户ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: '商品ID', required: false })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({ description: '帖子ID', required: false })
  @IsString()
  @IsOptional()
  postId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ description: '评论内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '用户ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class QueryCommentDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  pageSize?: number;

  @ApiProperty({ description: '商品ID', required: false })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({ description: '帖子ID', required: false })
  @IsString()
  @IsOptional()
  postId?: string;
}
