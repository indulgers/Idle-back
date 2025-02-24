import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({ description: '商品ID' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({ description: '发送者ID' })
  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @ApiProperty({ description: '接收者ID' })
  @IsString()
  @IsNotEmpty()
  sellerId: string;
}
