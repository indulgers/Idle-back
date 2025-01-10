import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RegisterUserDto } from './dto/register.dto';
import { ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { LoginData } from './types/user';
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject('DONATION_SERVICE')
  private donationService: ClientProxy;

  @Get()
  async getHello() {
    // const value = await firstValueFrom(
    //   this.donationService.send('donate', [1, 3, 5]),
    // );
    // return this.userService.getHello() + ' ' + value;
    return this.userService.getHello();
  }

  @Post('/login')
  @ApiBody({
    type: Object,
    description: 'User login',
    required: true,
  })
  async login(@Body() body: LoginData) {
    return await this.userService.login(body);
  }

  @Get('/list')
  @ApiQuery({
    name: 'page',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'The found records',
    type: [String],
  })
  async getUsers(page: number, limit: number) {
    return await this.userService.findUserList(page, limit);
  }

  // @Post('/register')
  // @ApiBody({
  //   type: RegisterUserDto,
  //   description: 'Register a new user',
  //   required: true,
  // })
  // async register(@Body() registerUser: RegisterUserDto) {
  //   return await this.userService.create(registerUser);
  // }
}
