import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
} from './dto/product.dto';
import { guid, ResultData } from '@app/common';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: {
          id: guid(),
          ...data,
          viewCount: 0,
          purchaseCount: 0,
          status: 'PENDING',
        },
      });

      return ResultData.ok(product);
    } catch (error) {
      throw new HttpException('创建物品失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, data: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new HttpException('物品不存在', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        updateTime: new Date(),
      },
    });

    return ResultData.ok(updated);
  }

  async delete(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new HttpException('物品不存在', HttpStatus.NOT_FOUND);
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        status: 'DELETED',
        updateTime: new Date(),
      },
    });

    return ResultData.ok(null, '删除成功');
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createTime: 'desc' },
          take: 10, // 默认获取最新的10条评论
        },
      },
    });

    if (!product) {
      throw new HttpException('物品不存在', HttpStatus.NOT_FOUND);
    }

    // 增加浏览次数
    await this.prisma.product.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });

    return ResultData.ok(product);
  }

  async findAll(query: QueryProductDto) {
    const { page = 1, pageSize = 10, communityId, status } = query;

    const where = {
      status: { not: 'DELETED' },
      ...(communityId && { communityId }),
      ...(status && { status }),
    };

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: {
          createTime: 'desc',
        },
      }),
    ]);

    return ResultData.ok({
      items,
      total,
      page,
      pageSize,
    });
  }

  async findByUserId(userId: string, query: QueryProductDto) {
    const { page = 1, pageSize = 10, status } = query;

    const where = {
      userId,
      status: { not: 'DELETED' },
      ...(status && { status }),
    };

    const [total, items] = await Promise.all([
      this.prisma.product.count({
        where,
      }),
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: {
          createTime: 'desc',
        },
      }),
    ]);

    return ResultData.ok({
      items,
      total,
      page,
      pageSize,
    });
  }

  async verify(id: string, status: 'VERIFIED' | 'REJECTED') {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new HttpException('物品不存在', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        status,
        updateTime: new Date(),
      },
    });

    return ResultData.ok(updated);
  }
}
