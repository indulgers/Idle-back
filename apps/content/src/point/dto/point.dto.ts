import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
export enum PointOperationType {
  ADD = 'ADD',
  DEDUCT = 'DEDUCT',
}
export class CreatePointDto {
  @ApiProperty({ description: '用户ID' })
  @IsNotEmpty()
  @IsString()
  userId: string;
  @ApiProperty({ description: '积分数量（正数）' })
  @IsInt()
  @Min(1)
  amount: number;
  @ApiProperty({
    description: '操作类型',
    enum: PointOperationType,
    default: PointOperationType.ADD,
  })
  @IsEnum(PointOperationType)
  @IsOptional()
  operation?: PointOperationType = PointOperationType.ADD;
  @ApiProperty({ description: '说明', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
export class QueryPointDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;
  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
  @ApiProperty({ description: '用户ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;
  @ApiProperty({ description: '开始时间', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;
  @ApiProperty({ description: '结束时间', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;
}
