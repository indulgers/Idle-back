import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: '商品ID' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ description: '数量', minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '用户id' })
  @IsNotEmpty()
  @IsString()
  userId: string;
}
