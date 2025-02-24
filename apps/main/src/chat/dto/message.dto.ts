import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
export class SendMessageDto {
  @ApiProperty({ description: '用户ID' })
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @ApiProperty({ description: '聊天室ID' })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({ description: '消息内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '消息类型' })
  @IsString()
  @IsNotEmpty()
  type: 'TEXT' | 'IMAGE' | 'PRODUCT';
}
