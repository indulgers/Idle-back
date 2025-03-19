import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { CreateOrderDto } from './dto/create-order.dto';
import { guid, ResultData } from '@app/common';
import { BehaviorService } from '../behavior/behavior.service'; // 添加行为服务导入
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private behaviorService: BehaviorService, // 注入行为服务
  ) {}

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

  async cancelOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`订单不存在`);
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
  async getOrderCounts(
    userId: string,
    query: { page?: number; pageSize?: number; status?: string },
  ) {
    try {
      // 查询所有可能的订单状态
      const allStatuses = [
        'PENDING',
        'PAID',
        'SHIPPING',
        'DELIVERED',
        'CANCELLED',
      ];

      // 构建查询条件
      const where: any = { userId };

      // 如果提供了状态参数，添加到查询条件中
      if (query.status && allStatuses.includes(query.status)) {
        where.status = query.status;
      }

      // 获取当前用户的订单状态计数
      const orderCounts = await this.prisma.order.groupBy({
        by: ['status'],
        where,
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

      // 如果指定了特定状态，同时返回符合该状态的订单列表
      if (query.status) {
        const { page = 1, pageSize = 10 } = query;

        const [total, orders] = await Promise.all([
          this.prisma.order.count({
            where,
          }),
          this.prisma.order.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: Number(pageSize),
            orderBy: { createTime: 'desc' },
            include: {
              product: true,
            },
          }),
        ]);

        return ResultData.ok({
          counts: result,
          orders: {
            items: orders,
            total,
            page,
            pageSize,
          },
        });
      }

      // 如果没有指定状态，只返回计数
      return ResultData.ok(result);
    } catch (error) {
      console.error('获取订单数量失败:', error);
      throw new HttpException(
        '获取订单数量失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 处理订单支付成功
  async updatePaymentSuccess(orderId: string, paymentInfo?: any) {
    try {
      // 1. 查找订单
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { product: true },
      });

      if (!order) {
        throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
      }

      // 2. 检查订单状态
      if (order.status !== 'PENDING') {
        throw new HttpException(
          '当前订单状态不允许支付',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 3. 更新订单状态为已支付
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          updateTime: new Date(),
          // 如果有支付信息，可以添加到订单的额外字段中
          // paymentInfo: paymentInfo ? JSON.stringify(paymentInfo) : undefined,
        },
      });

      // 4. 记录用户购买行为 - 对推荐系统很重要
      await this.behaviorService.recordPurchaseBehavior(
        order.userId,
        order.productId,
      );

      // 5. 可以添加更多业务逻辑，如发送通知给卖家等
      // TODO: 向卖家发送通知
      // TODO: 更新库存信息（如果需要）

      return ResultData.ok(updatedOrder, '支付成功');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('处理支付失败:', error);
      throw new HttpException('处理支付失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getSellerOrderCounts(
    sellerId: string,
    query: { page?: number; pageSize?: number; status?: string },
  ) {
    try {
      // 查询所有可能的订单状态
      const allStatuses = [
        'PENDING',
        'PAID',
        'SHIPPING',
        'DELIVERED',
        'CANCELLED',
      ];

      // 首先查出卖家的所有商品ID
      const sellerProducts = await this.prisma.product.findMany({
        where: { userId: sellerId },
        select: { id: true },
      });

      const productIds = sellerProducts.map((product) => product.id);

      if (productIds.length === 0) {
        return ResultData.ok({
          total: 0,
          PENDING: 0,
          PAID: 0,
          SHIPPING: 0,
          DELIVERED: 0,
          CANCELLED: 0,
        });
      }

      // 构建查询条件 - 根据商品ID查订单
      const where: any = {
        productId: { in: productIds },
      };

      // 如果提供了状态参数，添加到查询条件中
      if (query.status && allStatuses.includes(query.status)) {
        where.status = query.status;
      }

      // 获取当前商家的订单状态计数
      const orderCounts = await this.prisma.order.groupBy({
        by: ['status'],
        where,
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

      // 如果指定了特定状态，同时返回符合该状态的订单列表
      if (query.status) {
        const { page = 1, pageSize = 10 } = query;

        const [total, orders] = await Promise.all([
          this.prisma.order.count({
            where,
          }),
          this.prisma.order.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: Number(pageSize),
            orderBy: { createTime: 'desc' },
            include: {
              product: true,
              user: {
                // 包含买家信息
                select: {
                  id: true,
                  username: true,
                  nickname: true,
                  phone: true,
                },
              },
            },
          }),
        ]);

        return ResultData.ok({
          counts: result,
          orders: {
            items: orders,
            total,
            page,
            pageSize,
          },
        });
      }

      // 如果没有指定状态，只返回计数
      return ResultData.ok(result);
    } catch (error) {
      console.error('获取商家订单数量失败:', error);
      throw new HttpException(
        '获取商家订单数量失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async findSellerOrders(
    sellerId: string,
    query: { page?: number; pageSize?: number; status?: string },
  ) {
    try {
      const sellerProducts = await this.prisma.product.findMany({
        where: { userId: sellerId },
        select: { id: true },
      });
      console.log('sellerProducts', sellerProducts);
      // if (sellerProducts.length === 0) {
      //   return ResultData.ok([]);
      // }

      const productIds = sellerProducts.map((p) => p.id);

      const { page = 1, pageSize = 10 } = query;

      const orders = await this.prisma.order.findMany({
        where: {
          productId: { in: productIds },
        },
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: { createTime: 'desc' },
        include: {
          product: true,
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              phone: true,
            },
          },
        },
      });
      console.log('orders', orders);
      return ResultData.ok(orders);
    } catch (error) {
      console.error('获取商家订单列表失败:', error);
      throw new HttpException(
        '获取商家订单列表失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async updateOrderStatus(
    id: string,
    updateData: { status: string; sellerId: string },
  ) {
    try {
      const { status, sellerId } = updateData;

      // 1. 查找订单
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: { product: true },
      });

      if (!order) {
        throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
      }

      // 2. 确认是否为订单相关商品的卖家
      if (order.product.userId !== sellerId) {
        throw new HttpException('无权更新此订单', HttpStatus.FORBIDDEN);
      }

      // 3. 校验状态转换是否合法
      const validStatusTransitions = {
        PENDING: ['CANCELLED'],
        PAID: ['SHIPPING'],
        SHIPPING: ['DELIVERED'],
        DELIVERED: [],
        CANCELLED: [],
      };

      if (!validStatusTransitions[order.status]?.includes(status)) {
        throw new HttpException(
          `订单状态不能从 ${order.status} 更改为 ${status}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 4. 更新订单状态
      const updatedOrder = await this.prisma.order.update({
        where: { id },
        data: {
          status,
          updateTime: new Date(),
        },
      });

      // 5. 如果订单状态变为已发货，创建物流信息
      if (status === 'SHIPPING') {
        await this.createOrUpdateLogistics(id, order.userId, sellerId);
      }

      return ResultData.ok(updatedOrder, '订单状态已更新');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('更新订单状态失败:', error);
      throw new HttpException(
        '更新订单状态失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 创建或更新物流信息
  private async createOrUpdateLogistics(
    orderId: string,
    receiverId: string,
    senderId: string,
  ) {
    const existingLogistics = await this.prisma.logistics.findFirst({
      where: { transactionId: orderId },
    });

    if (existingLogistics) {
      return await this.prisma.logistics.update({
        where: { id: existingLogistics.id },
        data: {
          updateTime: new Date(),
          status: 'SHIPPING',
        },
      });
    }

    return await this.prisma.logistics.create({
      data: {
        id: guid(),
        transactionId: orderId,
        receiverId,
        senderId,
        status: 'SHIPPING',
        trackingNumber: `TN${Date.now()}`, // 生成临时跟踪号
      },
    });
  }
}
