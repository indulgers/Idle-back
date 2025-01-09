import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class DonateService {
  @Inject(PrismaService)
  private prisma: PrismaService;

  async getDonationList() {
    return await this.prisma.donation.findMany();
  }

  async getDonationbyPage(page: number) {
    return await this.prisma.donation.findMany({
      skip: (page - 1) * 10,
      take: 10,
    });
  }
}
