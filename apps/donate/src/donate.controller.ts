import { Controller, Get } from '@nestjs/common';
import { DonateService } from './donate.service';
import { MessagePattern } from '@nestjs/microservices';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller()
export class DonateController {
  constructor(private readonly donateService: DonateService) {}

  @Get()
  getDonationList() {
    return this.donateService.getDonationList();
  }

  @Get(':page')
  @ApiResponse({
    status: 200,
    description: 'The found record',
  })
  @ApiQuery({
    name: 'page',
    required: true,
    description: 'The page number to query',
  })
  getDonationbyPage(page: number) {
    return this.donateService.getDonationbyPage(page);
  }

  @MessagePattern('donate')
  sum(numArr: Array<number>): number {
    return numArr.reduce((total, item) => total + item, 0);
  }
}
