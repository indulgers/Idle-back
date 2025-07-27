import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ExchangeDonationDto {
  @ApiProperty({ description: '捐赠物品ID', example: 'donation123' })
  @IsNotEmpty({ message: '捐赠物品ID不能为空' })
  @IsString()
  donationId: string;

  @ApiProperty({ description: '用户ID', example: 'user123' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsString()
  userId: string;
}
