import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';

export class RegisterAdminDto {
  @ApiProperty({ description: '用户名', example: 'admin001' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  password: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsNotEmpty({ message: '手机号不能为空' })
  @IsPhoneNumber('CN', { message: '请输入有效的手机号码' })
  phone: string;

  @ApiProperty({ description: '社区ID', example: 'comm_shekou_haiwan' })
  @IsNotEmpty({ message: '社区ID不能为空' })
  @IsString()
  communityId: string;
}
