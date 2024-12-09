import { Controller, Get, Inject } from '@nestjs/common';
import { UserService } from './user.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject('DONATION_SERVICE')
  private donationService: ClientProxy;

  @Get()
  async getHello() {
    const value = await firstValueFrom(
      this.donationService.send('donate', [1, 3, 5]),
    );
    return this.userService.getHello() + ' ' + value;
  }
}
