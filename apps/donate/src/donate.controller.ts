import { Controller, Get } from '@nestjs/common';
import { DonateService } from './donate.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class DonateController {
  constructor(private readonly donateService: DonateService) {}

  @Get()
  getHello(): string {
    return this.donateService.getHello();
  }

  @MessagePattern('donate')
  sum(numArr: Array<number>): number {
    return numArr.reduce((total, item) => total + item, 0);
  }
}
