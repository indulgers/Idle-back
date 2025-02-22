import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class WxLoginDto {
  @ApiProperty({ description: '微信小程序登录码' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
