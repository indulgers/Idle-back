import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class PhoneLoginDto {
  @ApiProperty({ description: '微信登录 code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '手机号获取凭证' })
  @IsString()
  @IsNotEmpty()
  phoneCode: string;
}
