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

  async getGlobalDashboardOverview(
    timeRange: TimeRangeDto,
  ): Promise<DashboardOverviewDto> {
    // 不传入communityId，获取全局数据
    const globalTimeRange = { ...timeRange };
    delete globalTimeRange.communityId;

    return this.getDashboardOverview(globalTimeRange);
  }

  private async getUserAnalytics(
    timeRange: TimeRangeDto,
  ): Promise<UserAnalyticsDto> {
    const { startDate, endDate, communityId } = timeRange;

    // 构建查询条件
    const whereCondition: any = {};
    if (communityId) {
      whereCondition.communityId = communityId;
    }

    // 获取总用户数
    const totalUsers = Number(
      await this.prisma.user.count({
        where: whereCondition,
      }),
    );

    // 获取活跃用户数（在指定时间范围内有登录记录的用户）
    const activeUsers = Number(
      await this.prisma.user.count({
        where: {
          ...whereCondition,
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
          ...whereCondition,
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
          ...whereCondition,
          createTime: {
            lt: new Date(startDate),
          },
        },
      }),
    );

    const userGrowthRate =
      previousPeriodUsers === 0 ? 100 : (newUsers / previousPeriodUsers) * 100;

    // 获取用户活跃度趋势
    let userActivityTrendQuery = `
      SELECT 
        DATE(createTime) as date,
        CAST(COUNT(*) AS SIGNED) as activeUsers
      FROM \`User\`
      WHERE createTime BETWEEN ? AND ?
    `;

    const queryParams = [new Date(startDate), new Date(endDate)];

    // if (communityId) {
    //   userActivityTrendQuery += ` AND communityId = ?`;
    //   queryParams.push(communityId as string);
    // }

    userActivityTrendQuery += `
      GROUP BY DATE(createTime)
      ORDER BY date ASC
    `;

    const userActivityTrend = await this.prisma.$queryRawUnsafe(
      userActivityTrendQuery,
      ...queryParams,
    );

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
    const { startDate, endDate, communityId } = timeRange;

    // 构建查询条件
    const whereCondition: any = {
      createTime: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      status: 'COMPLETED',
    };

    // 如果指定了社区ID，需要关联Product表进行查询
    let transactions;
    if (communityId) {
    } else {
      transactions = await this.prisma.order.findMany({
        where: whereCondition,
        select: {
          totalPrice: true,
        },
      });
    }

    const totalAmount = transactions.reduce(
      (sum, t) => sum + Number(t.totalPrice),
      0,
    );
    const transactionCount = transactions.length;
    const averageAmount =
      transactionCount > 0 ? totalAmount / transactionCount : 0;

    // 获取交易趋势
    let transactionTrendQuery = `
      SELECT 
        DATE(o.createTime) as date,
        CAST(SUM(o.totalPrice) AS SIGNED) as amount,
        CAST(COUNT(*) AS SIGNED) as count
      FROM \`Order\` o
    `;

    if (communityId) {
      transactionTrendQuery += `
        JOIN \`Product\` p ON o.productId = p.id
        WHERE o.createTime BETWEEN ? AND ?
          AND o.status = 'COMPLETED'
          AND p.communityId = ?
      `;
    } else {
      transactionTrendQuery += `
        WHERE o.createTime BETWEEN ? AND ?
          AND o.status = 'COMPLETED'
      `;
    }

    transactionTrendQuery += `
      GROUP BY DATE(o.createTime)
      ORDER BY date ASC
    `;

    const queryParams = [new Date(startDate), new Date(endDate)];
    if (communityId) {
      queryParams.push(communityId as any);
    }

    const transactionTrend = await this.prisma.$queryRawUnsafe(
      transactionTrendQuery,
      ...queryParams,
    );

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
    const { startDate, endDate, communityId } = timeRange;

    // 构建查询条件
    const whereCondition: any = {};
    if (communityId) {
      whereCondition.communityId = communityId;
    }

    // 获取商品统计
    const totalProducts = Number(
      await this.prisma.product.count({
        where: whereCondition,
      }),
    );

    const listedProducts = Number(
      await this.prisma.product.count({
        where: {
          ...whereCondition,
          status: 'VERIFIED',
        },
      }),
    );

    // 获取热门商品TOP10
    let topProductsQuery = `
      SELECT 
        p.id,
        p.name,
        CAST(COUNT(o.id) AS SIGNED) as sales,
        CAST(SUM(o.totalPrice) AS SIGNED) as revenue
      FROM \`Product\` p
      LEFT JOIN \`Order\` o ON o.productId = p.id
      WHERE o.createTime BETWEEN ? AND ?
        AND o.status = 'COMPLETED'
    `;

    const queryParams = [new Date(startDate), new Date(endDate)];

    if (communityId) {
      topProductsQuery += ` AND p.communityId = ?`;
      queryParams.push(communityId as any);
    }

    topProductsQuery += `
      GROUP BY p.id, p.name
      ORDER BY sales DESC
      LIMIT 10
    `;

    const topProducts = await this.prisma.$queryRawUnsafe(
      topProductsQuery,
      ...queryParams,
    );

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
