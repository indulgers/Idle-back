import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { CreateOrderDto } from './dto/create-order.dto';
import { guid, ResultData } from '@app/common';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    try {
      // 1. 查询商品是否存在且可购买
      const product = await this.prisma.product.findUnique({
        where: {
          id: dto.productId,
          status: 'VERIFIED', // 确保商品已通过审核
        },
      });

      if (!product) {
        throw new HttpException(
          '商品不存在或未通过审核',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 2. 计算订单总价
      const totalPrice = product.price * dto.quantity;

      // 3. 创建订单
      const order = await this.prisma.order.create({
        data: {
          id: guid(),
          userId: dto.userId,
          productId: dto.productId,
          quantity: dto.quantity,
          totalPrice,
          status: 'PENDING',
        },
      });

      // 4. 记录用户购买行为
      await this.prisma.userBehavior.upsert({
        where: {
          userId_productId_type: {
            userId: order.userId,
            productId: dto.productId,
            type: 'PURCHASE',
          },
        },
        update: {
          weight: { increment: 1 },
        },
        create: {
          id: guid(),
          userId: order.userId,
          productId: dto.productId,
          type: 'PURCHASE',
          weight: 1,
        },
      });

      // 5. 更新商品购买次数
      await this.prisma.product.update({
        where: { id: dto.productId },
        data: {
          purchaseCount: { increment: dto.quantity },
        },
      });

      return ResultData.ok(order);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('创建订单失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUserId(
    userId: string,
    query: { page?: number; pageSize?: number },
  ) {
    const { page = 1, pageSize = 10 } = query;

    const [total, orders] = await Promise.all([
      this.prisma.order.count({
        where: { userId },
      }),
      this.prisma.order.findMany({
        where: { userId },
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: { createTime: 'desc' },
        include: {
          product: true,
        },
      }),
    ]);

    return ResultData.ok({
      items: orders,
      total,
      page,
      pageSize,
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`订单不存在`);
    }

    if (order.userId !== userId) {
      throw new HttpException('无权访问此订单', HttpStatus.FORBIDDEN);
    }

    // 查询相关物流信息
    const logistics = await this.prisma.logistics.findFirst({
      where: { transactionId: id },
    });

    return ResultData.ok({
      ...order,
      logistics,
    });
  }

  async cancelOrder(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`订单不存在`);
    }

    if (order.userId !== userId) {
      throw new HttpException('无权取消此订单', HttpStatus.FORBIDDEN);
    }

    if (order.status !== 'PENDING') {
      throw new HttpException('只能取消待处理的订单', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updateTime: new Date(),
      },
    });

    return ResultData.ok(updated);
  }
  async getOrderCounts(userId: string) {
    try {
      // 查询所有可能的订单状态
      const allStatuses = [
        'PENDING',
        'PAID',
        'SHIPPING',
        'DELIVERED',
        'CANCELLED',
      ];

      // 获取当前用户的所有订单状态计数
      const orderCounts = await this.prisma.order.groupBy({
        by: ['status'],
        where: {
          userId,
        },
        _count: {
          status: true,
        },
      });

      // 构建结果对象，确保所有状态都有值
      const result = {
        total: 0,
        PENDING: 0,
        PAID: 0,
        SHIPPING: 0,
        DELIVERED: 0,
        CANCELLED: 0,
      };

      // 填充实际计数值
      orderCounts.forEach((item) => {
        result[item.status] = item._count.status;
        result.total += item._count.status;
      });

      return ResultData.ok(result);
    } catch (error) {
      throw new HttpException(
        '获取订单数量失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
