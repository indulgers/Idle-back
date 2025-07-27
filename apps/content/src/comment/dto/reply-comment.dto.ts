import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateReplyCommentDto {
  @ApiProperty({ description: '回复内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '用户ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: '原始评论ID' })
  @IsString()
  @IsNotEmpty()
  commentId: string;

  @ApiProperty({ description: '回复的评论ID' })
  @IsString()
  @IsNotEmpty()
  replyToId: string;

  @ApiProperty({ description: '被回复用户ID' })
  @IsString()
  @IsNotEmpty()
  replyToUserId: string;
}

export class UpdateReplyCommentDto {
  @ApiProperty({ description: '回复内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '用户ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class QueryReplyCommentDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  pageSize?: number;

  @ApiProperty({ description: '原始评论ID', required: false })
  @IsString()
  @IsOptional()
  commentId?: string;

  @ApiProperty({ description: '回复的评论ID', required: false })
  @IsString()
  @IsOptional()
  replyToId?: string;
}
