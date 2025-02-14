import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { guid } from '@app/common';

@Injectable()
export class DonateService {
  @Inject(PrismaService)
  private prisma: PrismaService;

  async create(dto: any) {
    const id = guid();
    return await this.prisma.donation.create({
      data: { id, ...dto },
    });
  }

  async findAll(query: { page?: number; pageSize?: number }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const data = await this.prisma.donation.findMany({
      skip,
      take: Number(pageSize),
      orderBy: { createTime: 'desc' },
    });
    const total = await this.prisma.donation.count();
    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    await this.prisma.donation.findUnique({ where: { id: id } });
    return await this.prisma.donation.findUnique({ where: { id } });
  }

  async update(id: string, dto: any) {
    return await this.prisma.donation.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return await this.prisma.donation.delete({ where: { id } });
  }
}
