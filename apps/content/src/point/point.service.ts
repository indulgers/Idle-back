import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { guid, ResultData } from '@app/common';
import {
  CreatePointDto,
  PointOperationType,
  QueryPointDto,
} from './dto/point.dto';

@Injectable()
export class PointService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建积分记录
   * @param data 积分数据
   */
  async create(data: CreatePointDto) {
    try {
      // 计算实际积分变化值（加分为正，扣分为负）
      const actualAmount =
        data.operation === PointOperationType.DEDUCT
          ? -Math.abs(data.amount)
          : Math.abs(data.amount);

      const point = await this.prisma.point.create({
        data: {
          id: guid(),
          userId: data.userId,
          amount: actualAmount,
          createTime: new Date(),
          updateTime: new Date(),
        },
      });

      return ResultData.ok(point);
    } catch (error) {
      console.error('创建积分记录失败:', error);
      throw new HttpException(
        '创建积分记录失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取用户积分历史记录
   * @param query 查询参数
   */
  async findAll(query: QueryPointDto) {
    try {
      const { page = 1, pageSize = 10, userId, startDate, endDate } = query;

      const where = {
        ...(userId && { userId }),
        ...(startDate && {
          createTime: {
            gte: new Date(startDate),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }),
      };

      const [total, items] = await Promise.all([
        this.prisma.point.count({ where }),
        this.prisma.point.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: Number(pageSize),
          orderBy: { createTime: 'desc' },
        }),
      ]);

      return ResultData.ok({
        items,
        total,
        page,
        pageSize,
      });
    } catch (error) {
      console.error('获取积分记录失败:', error);
      throw new HttpException(
        '获取积分记录失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取用户积分总额
   * @param userId 用户ID
   */
  async getUserTotalPoints(userId: string) {
    try {
      const result = await this.prisma.point.aggregate({
        where: { userId },
        _sum: { amount: true },
      });

      const totalPoints = result._sum.amount || 0;

      return ResultData.ok({ userId, totalPoints });
    } catch (error) {
      console.error('获取用户积分总额失败:', error);
      throw new HttpException(
        '获取用户积分总额失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 验证用户是否有足够积分
   * @param userId 用户ID
   * @param requiredPoints 所需积分
   */
  async validateUserPoints(userId: string, requiredPoints: number) {
    try {
      const { data } = await this.getUserTotalPoints(userId);
      const hasEnoughPoints = data.totalPoints >= requiredPoints;

      return ResultData.ok({
        userId,
        totalPoints: data.totalPoints,
        requiredPoints,
        hasEnoughPoints,
      });
    } catch (error) {
      console.error('验证用户积分失败:', error);
      throw new HttpException(
        '验证用户积分失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 执行积分交易 (原子操作)
   * @param userId 用户ID
   * @param amount 积分数量
   * @param description 说明
   */
  async executePointTransaction(
    userId: string,
    amount: number,
    description?: string,
  ) {
    try {
      // 如果是扣除积分，先验证是否有足够的积分
      if (amount < 0) {
        const validation = await this.validateUserPoints(
          userId,
          Math.abs(amount),
        );
        if (!validation.data.hasEnoughPoints) {
          throw new HttpException('积分不足', HttpStatus.BAD_REQUEST);
        }
      }

      const point = await this.prisma.point.create({
        data: {
          id: guid(),
          userId,
          amount,
          createTime: new Date(),
          updateTime: new Date(),
        },
      });

      return ResultData.ok(point);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('积分交易执行失败:', error);
      throw new HttpException(
        '积分交易执行失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
