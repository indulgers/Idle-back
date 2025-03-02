import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
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

  @Get('profile/:id')
  @ApiOperation({ summary: '获取用户资料' })
  @ApiParam({ name: 'id', description: '用户ID' })
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserProfile(id);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索用户' })
  @ApiQuery({ name: 'keyword', description: '搜索关键词', required: false })
  @ApiQuery({ name: 'communityId', description: '社区ID', required: false })
  async searchUsers(
    @Query('keyword') keyword?: string,
    @Query('communityId') communityId?: string,
  ) {
    return this.userService.searchUsers({ keyword, communityId });
  }
}
