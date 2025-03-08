import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
// 导入 Prisma 生成的枚举
import { VerificationStatus } from '@prisma/client';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class CreateProductDto {
  @ApiProperty({ description: '物品名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '物品描述' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: '价格(分)' })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ description: '用户ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: '社区ID' })
  @IsString()
  @IsNotEmpty()
  communityId: string;

  @ApiProperty({ description: '分类ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'url' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ description: '标签' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags: string;
}

export class UpdateProductDto {
  @ApiProperty({ description: '物品名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '物品描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '价格(分)' })
  @IsNumber()
  @IsOptional()
  price?: number;
}

export class QueryProductDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @ApiProperty({ description: '社区ID', required: false })
  @IsOptional()
  @IsString()
  communityId?: string;

  @ApiProperty({
    description: '状态',
    required: false,
    enum: VerificationStatus,
    enumName: 'VerificationStatus',
  })
  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;

  @ApiProperty({ description: '关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '排序字段', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ description: '排序方向', required: false, enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @ApiProperty({ description: '最低价格(分)', required: false })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiProperty({ description: '最高价格(分)', required: false })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiProperty({ description: '商品成色', required: false })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiProperty({ description: '分类ID', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: '用户ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}
