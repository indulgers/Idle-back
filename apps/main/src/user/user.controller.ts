import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { PhoneLoginDto } from './dto/phone.dto';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  @ApiOperation({ summary: '手机号登录' })
  async login(@Body() loginData: PhoneLoginDto) {
    return this.userService.login(loginData);
  }
}
