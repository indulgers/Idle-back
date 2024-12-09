import { Injectable } from '@nestjs/common';

@Injectable()
export class DonateService {
  getHello(): string {
    return 'Hello donate!';
  }
}
