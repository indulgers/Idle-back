import { ApiProperty } from '@nestjs/swagger';

export class TimeRangeDto {
  @ApiProperty({ description: '开始时间', example: '2024-01-01' })
  startDate: string;

  @ApiProperty({ description: '结束时间', example: '2024-03-17' })
  endDate: string;
  
  @ApiProperty({ description: '社区ID', example: 'comm_fucheng_fucheng', required: false })
  communityId?: string;
}

export class UserAnalyticsDto {
  @ApiProperty({ description: '总用户数' })
  totalUsers: number;

  @ApiProperty({ description: '活跃用户数' })
  activeUsers: number;

  @ApiProperty({ description: '新增用户数' })
  newUsers: number;

  @ApiProperty({ description: '用户增长率' })
  userGrowthRate: number;

  @ApiProperty({ description: '用户活跃度趋势' })
  userActivityTrend: {
    date: string;
    activeUsers: number;
  }[];
}

export class TransactionAnalyticsDto {
  @ApiProperty({ description: '总交易金额' })
  totalAmount: number;

  @ApiProperty({ description: '交易笔数' })
  transactionCount: number;

  @ApiProperty({ description: '平均交易金额' })
  averageAmount: number;

  @ApiProperty({ description: '交易趋势' })
  transactionTrend: {
    date: string;
    amount: number;
    count: number;
  }[];
}

export class ProductAnalyticsDto {
  @ApiProperty({ description: '总商品数' })
  totalProducts: number;

  @ApiProperty({ description: '上架商品数' })
  listedProducts: number;

  @ApiProperty({ description: '热门商品TOP10' })
  topProducts: {
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }[];
}

export class DashboardOverviewDto {
  @ApiProperty({ description: '用户分析' })
  userAnalytics: UserAnalyticsDto;

  @ApiProperty({ description: '交易分析' })
  transactionAnalytics: TransactionAnalyticsDto;

  @ApiProperty({ description: '商品分析' })
  productAnalytics: ProductAnalyticsDto;
} 