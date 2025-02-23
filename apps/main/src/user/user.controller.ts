import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { WxLoginDto } from './dto/login.dto';
import { SendSmsDto, PhoneLoginDto } from './dto/sms.dto';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('wx-login')
  @ApiOperation({ summary: '微信小程序登录' })
  async login(@Body() loginData: WxLoginDto) {
    return this.userService.wxLogin(loginData.code);
  }

  @Post('send-code')
  @ApiOperation({ summary: '发送手机验证码' })
  async sendSmsCode(@Body() data: SendSmsDto) {
    return this.userService.sendSmsCode(data.phone);
  }

  @Post('phone-login')
  @ApiOperation({ summary: '手机号登录' })
  async phoneLogin(@Body() data: PhoneLoginDto) {
    return this.userService.phoneLogin(data.phone, data.code);
  }
}
