import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { DonationStatus } from '@prisma/client';

export class QueryDonationDto {
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

  @ApiProperty({ description: '社区ID', required: false })
  @IsOptional()
  @IsString()
  communityId?: string;

  @ApiProperty({ description: '捐赠者用户ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: '领取者用户ID', required: false })
  @IsOptional()
  @IsString()
  claimId?: string;

  @ApiProperty({ description: '分类ID', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: '状态', enum: DonationStatus, required: false })
  @IsOptional()
  @IsEnum(DonationStatus)
  status?: DonationStatus;

  @ApiProperty({ description: '活动ID', required: false })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiProperty({ description: '关键词搜索', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;
}
