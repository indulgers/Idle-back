import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({ description: '手机号' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  phone: string;
}

export class PhoneLoginDto {
  @ApiProperty({ description: '手机号' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  phone: string;

  @ApiProperty({ description: '验证码' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
