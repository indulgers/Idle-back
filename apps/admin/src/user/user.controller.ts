import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
@Controller('user')
@ApiTags('user')
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
    return 'Hello World!';
  }

  @Post('/login')
  @ApiBody({
    type: Object,
    description: 'User login',
    required: true,
  })
  async signIn(@Body() body: LoginDto) {
    return await this.userService.login(body);
  }

  @Get('/list')
  @ApiQuery({
    name: 'page',
  })
  @ApiQuery({
    name: 'pageSize',
  })
  @ApiQuery({
    name: 'name',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'The found records',
    type: [String],
  })
  async getUsers(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('name') name?: string,
  ) {
    return await this.userService.findUserList({ page, pageSize, name });
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
