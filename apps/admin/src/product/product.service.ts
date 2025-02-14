import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { guid, ResultData } from '@app/common';

@Injectable()
export class ProductService {
  @Inject(PrismaService)
  private prisma: PrismaService;

  async create(dto: any) {
    const id = guid();
    return ResultData.ok(
      await this.prisma.product.create({ data: { ...dto, id } }),
    );
  }

  async findAll(query: { page?: number; pageSize?: number; name?: string }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = Number((page - 1) * pageSize);
    const where = query.name
      ? { name: { contains: query.name, mode: 'insensitive' } }
      : {};
    const data = await this.prisma.product.findMany({
      where,
      skip,
      take: Number(pageSize),
      orderBy: { createTime: 'desc' },
    });
    const total = await this.prisma.product.count({ where });
    // const serializedData = serializeBigInts({ data, total, page, pageSize }); // Use the function

    return ResultData.ok({
      list: data,
      pagination: {
        current: page,
        pageSize: pageSize,
        total,
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.product.findUnique({ where: { id } });
  }

  async update(id: string, dto: any) {
    return ResultData.ok(
      await this.prisma.product.update({ where: { id }, data: dto }),
    );
  }

  async remove(id: string) {
    return ResultData.ok(await this.prisma.product.delete({ where: { id } }));
  }
}
