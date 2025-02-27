import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

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
  page?: number;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  pageSize?: number;

  @ApiProperty({ description: '社区ID', required: false })
  @IsOptional()
  communityId?: string;

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DELETED';
}
