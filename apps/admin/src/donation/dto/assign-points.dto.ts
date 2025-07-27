import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';

export class AssignPointsDto {
  @ApiProperty({ description: '捐赠ID', example: 'donation123' })
  @IsNotEmpty({ message: '捐赠ID不能为空' })
  @IsString()
  donationId: string;

  @ApiProperty({ description: '分配的积分值', example: 50 })
  @IsNotEmpty({ message: '积分值不能为空' })
  @IsInt()
  @Min(1, { message: '积分值必须大于0' })
  pointValue: number;

  @ApiProperty({ description: '分配说明', example: '根据物品价值评估', required: false })
  @IsString()
  note?: string;
} 