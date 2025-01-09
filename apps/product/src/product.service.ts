import { ResultData } from '@app/common';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ProductService {
  @Inject(PrismaService)
  private prisma: PrismaService;

  async findUserList(page: number = 0, limit: number = 10) {
    const [total, list] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.findMany({
        skip: page * limit,
        take: limit,
        orderBy: {
          createTime: 'desc',
        },
      }),
    ]);

    return ResultData.ok({
      list,
      pagination: {
        current: page,
        pageSize: limit,
        total,
      },
    });
  }
}
