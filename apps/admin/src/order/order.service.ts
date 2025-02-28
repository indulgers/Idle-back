import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { QueryOrderDto } from './dto/query-order.dto';
import { ResultData } from '@app/common';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // create(createOrderDto: CreateOrderDto) {
  //   return ResultData.fail(403, '管理员不能创建订单');
  // }

  // 查询所有订单，支持分页和筛选
  async findAll(query: QueryOrderDto) {
    const {
      page = 1,
      pageSize = 10,
      userId,
      productId,
      startDate,
      endDate,
    } = query;

    // 构建查询条件
    const where = {
      ...(userId && { userId }),
      ...(productId && { productId }),
      ...((startDate || endDate) && {
        createTime: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: { createTime: 'desc' },
      }),
    ]);

    // 获取订单关联的产品和用户信息
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const [product, user, logistics] = await Promise.all([
          this.prisma.product.findUnique({
            where: { id: order.productId },
          }),
          this.prisma.user.findUnique({
            where: { id: order.userId },
            select: {
              id: true,
              username: true,
              nickname: true,
              phone: true,
              email: true,
              avatar: true,
            },
          }),
          this.prisma.logistics.findFirst({
            where: { transactionId: order.id },
          }),
        ]);

        return {
          ...order,
          product,
          user,
          logistics,
        };
      }),
    );

    return ResultData.ok({
      items: enrichedOrders,
      total,
      page,
      pageSize,
    });
  }

  // 查询单个订单详情，包含产品、用户和物流信息
  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`订单 #${id} 不存在`);
    }

    // 获取关联信息
    const [product, user, logistics] = await Promise.all([
      this.prisma.product.findUnique({
        where: { id: order.productId },
      }),
      this.prisma.user.findUnique({
        where: { id: order.userId },
        select: {
          id: true,
          username: true,
          nickname: true,
          phone: true,
          email: true,
          avatar: true,
          communityId: true,
        },
      }),
      this.prisma.logistics.findFirst({
        where: { transactionId: id },
      }),
    ]);

    // 如果有物流信息，获取收件人和发件人信息
    let sender = null;
    let receiver = null;

    if (logistics) {
      [sender, receiver] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: logistics.senderId },
          select: { id: true, username: true, nickname: true, phone: true },
        }),
        this.prisma.user.findUnique({
          where: { id: logistics.receiverId },
          select: { id: true, username: true, nickname: true, phone: true },
        }),
      ]);
    }

    return ResultData.ok({
      ...order,
      product,
      user,
      logistics: logistics
        ? {
            ...logistics,
            sender,
            receiver,
          }
        : null,
    });
  }

  // 管理员可以更新订单状态
  // async update(id: string, updateOrderDto: UpdateOrderDto) {
  //   const order = await this.prisma.order.findUnique({
  //     where: { id },
  //   });

  //   if (!order) {
  //     throw new NotFoundException(`订单 #${id} 不存在`);
  //   }

  //   const updated = await this.prisma.order.update({
  //     where: { id },
  //     data: updateOrderDto,
  //   });

  //   return ResultData.ok(updated);
  // }

  // 软删除功能
  async remove(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`订单 #${id} 不存在`);
    }

    // 记录删除操作但不真正删除数据
    await this.prisma.order.update({
      where: { id },
      data: {
        // 在 Order 表添加 status 字段后可启用：
        // status: 'DELETED',
        updateTime: new Date(),
      },
    });

    return ResultData.ok(null, '订单已删除');
  }
}
