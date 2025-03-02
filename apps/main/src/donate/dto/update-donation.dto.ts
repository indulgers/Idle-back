import { PartialType } from '@nestjs/swagger';
import { CreateDonationDto } from './create-donation.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  Min,
  IsInt,
  Max,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import { DonationStatus } from '@prisma/client';

export class UpdateDonationDto extends PartialType(CreateDonationDto) {
  @ApiProperty({ description: '状态', enum: DonationStatus, required: false })
  @IsOptional()
  @IsEnum(DonationStatus)
  status?: DonationStatus;

  @ApiProperty({ description: '审核备注', required: false })
  @IsOptional()
  @IsString()
  verifyNote?: string;

  @ApiProperty({ description: '用户ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}
export class FeedbackDonationDto {
  @ApiProperty({ description: '捐赠物品ID', example: 'donation123' })
  @IsNotEmpty({ message: '捐赠物品ID不能为空' })
  @IsString()
  donationId: string;

  @ApiProperty({ description: '评分(1-5)', example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: '评价内容',
    example: '收到了，物品很好，谢谢！',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ description: '反馈图片URLs', type: [String], required: false })
  @IsOptional()
  @IsArray()
  images?: string[];
}
export class ClaimDonationDto {
  @ApiProperty({ description: '捐赠物品ID', example: 'donation123' })
  @IsNotEmpty({ message: '捐赠物品ID不能为空' })
  @IsString()
  donationId: string;

  @ApiProperty({ description: '领取者用户ID', example: 'user123' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsString()
  userId: string;
}
