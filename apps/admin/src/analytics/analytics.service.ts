import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import {
  TimeRangeDto,
  UserAnalyticsDto,
  TransactionAnalyticsDto,
  ProductAnalyticsDto,
  DashboardOverviewDto,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardOverview(
    timeRange: TimeRangeDto,
  ): Promise<DashboardOverviewDto> {
    const [userAnalytics, transactionAnalytics, productAnalytics] =
      await Promise.all([
        this.getUserAnalytics(timeRange),
        this.getTransactionAnalytics(timeRange),
        this.getProductAnalytics(timeRange),
      ]);

    return {
      userAnalytics,
      transactionAnalytics,
      productAnalytics,
    };
  }

  private async getUserAnalytics(
    timeRange: TimeRangeDto,
  ): Promise<UserAnalyticsDto> {
    const { startDate, endDate } = timeRange;

    // 获取总用户数
    const totalUsers = Number(await this.prisma.user.count());

    // 获取活跃用户数（在指定时间范围内有登录记录的用户）
    const activeUsers = Number(
      await this.prisma.user.count({
        where: {
          updateTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      }),
    );

    // 获取新增用户数
    const newUsers = Number(
      await this.prisma.user.count({
        where: {
          createTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      }),
    );

    // 计算用户增长率
    const previousPeriodUsers = Number(
      await this.prisma.user.count({
        where: {
          createTime: {
            lt: new Date(startDate),
          },
        },
      }),
    );

    const userGrowthRate =
      previousPeriodUsers === 0 ? 100 : (newUsers / previousPeriodUsers) * 100;

    // 获取用户活跃度趋势
    const userActivityTrend = await this.prisma.$queryRaw`
      SELECT 
        DATE(createTime) as date,
        CAST(COUNT(*) AS SIGNED) as activeUsers
      FROM \`User\`
      WHERE createTime BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}
      GROUP BY DATE(createTime)
      ORDER BY date ASC
    `;

    return {
      totalUsers,
      activeUsers,
      newUsers,
      userGrowthRate,
      userActivityTrend: userActivityTrend as {
        date: string;
        activeUsers: number;
      }[],
    };
  }

  private async getTransactionAnalytics(
    timeRange: TimeRangeDto,
  ): Promise<TransactionAnalyticsDto> {
    const { startDate, endDate } = timeRange;

    // 获取交易统计
    const transactions = await this.prisma.order.findMany({
      where: {
        createTime: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        status: 'COMPLETED',
      },
      select: {
        totalPrice: true,
      },
    });

    const totalAmount = transactions.reduce(
      (sum, t) => sum + Number(t.totalPrice),
      0,
    );
    const transactionCount = transactions.length;
    const averageAmount =
      transactionCount > 0 ? totalAmount / transactionCount : 0;

    // 获取交易趋势
    const transactionTrend = await this.prisma.$queryRaw`
      SELECT 
        DATE(createTime) as date,
        CAST(SUM(totalPrice) AS SIGNED) as amount,
        CAST(COUNT(*) AS SIGNED) as count
      FROM \`Order\`
      WHERE createTime BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}
        AND status = 'COMPLETED'
      GROUP BY DATE(createTime)
      ORDER BY date ASC
    `;

    return {
      totalAmount,
      transactionCount,
      averageAmount,
      transactionTrend: transactionTrend as {
        date: string;
        amount: number;
        count: number;
      }[],
    };
  }

  private async getProductAnalytics(
    timeRange: TimeRangeDto,
  ): Promise<ProductAnalyticsDto> {
    const { startDate, endDate } = timeRange;

    // 获取商品统计
    const totalProducts = Number(await this.prisma.product.count());
    const listedProducts = Number(
      await this.prisma.product.count({
        where: {
          status: 'VERIFIED',
        },
      }),
    );

    // 获取热门商品TOP10
    const topProducts = await this.prisma.$queryRaw`
      SELECT 
        p.id,
        p.name,
        CAST(COUNT(o.id) AS SIGNED) as sales,
        CAST(SUM(o.totalPrice) AS SIGNED) as revenue
      FROM \`Product\` p
      LEFT JOIN \`Order\` o ON o.productId = p.id
      WHERE o.createTime BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}
        AND o.status = 'COMPLETED'
      GROUP BY p.id, p.name
      ORDER BY sales DESC
      LIMIT 10
    `;

    return {
      totalProducts,
      listedProducts,
      topProducts: topProducts as {
        id: string;
        name: string;
        sales: number;
        revenue: number;
      }[],
    };
  }
}
