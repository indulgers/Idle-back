import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VerificationStatus } from '@prisma/client';

export class VerifyAdminDto {
  @ApiProperty({
    description: '审核状态',
    enum: VerificationStatus,
    example: 'VERIFIED', // 使用正确的枚举值作为示例
    enumName: 'VerificationStatus',
  })
  @IsEnum(VerificationStatus, {
    message: '状态必须是以下值之一: VERIFIED, REJECTED',
  })
  @IsNotEmpty()
  status: VerificationStatus;

  @ApiProperty({
    description: '审核备注',
    example: '审核通过',
    required: false,
  })
  @IsString()
  @IsOptional()
  verifyNote?: string;
}
