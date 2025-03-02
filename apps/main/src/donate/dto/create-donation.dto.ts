import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateDonationDto {
  @ApiProperty({ description: '物品名称', example: '儿童自行车' })
  @IsNotEmpty({ message: '物品名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '物品描述', example: '九成新，5-8岁孩子使用' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '分类ID', example: 'category123' })
  @IsNotEmpty({ message: '分类ID不能为空' })
  @IsString()
  categoryId: string;

  @ApiProperty({ description: '物品成色', example: '9成新' })
  @IsNotEmpty({ message: '物品成色不能为空' })
  @IsString()
  condition: string;

  @ApiProperty({
    description: '物品图片URLs (逗号分隔)',
    example: 'url1,url2,url3',
  })
  @IsNotEmpty({ message: '物品图片不能为空' })
  @IsString()
  images: string;

  @ApiProperty({ description: '积分价值', example: 50, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  pointValue?: number;

  @ApiProperty({ description: '活动ID', example: 'event123', required: false })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiProperty({ description: '社区ID', example: 'community123' })
  @IsNotEmpty({ message: '社区ID不能为空' })
  @IsString()
  communityId: string;

  @ApiProperty({ description: '用户ID', example: 'user123' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsString()
  userId: string;
}
