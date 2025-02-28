import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class QueryOrderDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @ApiProperty({ description: '用户ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: '商品ID', required: false })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
