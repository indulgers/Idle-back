import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { WxLoginDto } from './dto/login.dto';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('wx-login')
  @ApiOperation({ summary: '微信小程序登录' })
  async wxLogin(@Body() wxLoginDto: WxLoginDto) {
    return this.userService.wxLogin(wxLoginDto.code);
  }
}
