import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TimeRangeDto } from './dto/analytics.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('analytics')
@Controller('analytics')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取仪表盘概览数据' })
  async getDashboardOverview(@Query() timeRange: TimeRangeDto) {
    return this.analyticsService.getDashboardOverview(timeRange);
  }

  @Get('dashboard/community/:communityId')
  @ApiOperation({ summary: '获取指定社区的仪表盘概览数据' })
  @ApiParam({
    name: 'communityId',
    description: '社区ID',
    example: 'comm_fucheng_fucheng',
  })
  async getCommunityDashboardOverview(
    @Param('communityId') communityId: string,
    @Query() timeRange: TimeRangeDto,
  ) {
    // 将社区ID添加到查询参数中
    timeRange.communityId = communityId;
    return this.analyticsService.getDashboardOverview(timeRange);
  }

  @Get('dashboard/global')
  @ApiOperation({ summary: '获取全局仪表盘概览数据（仅超级管理员）' })
  async getGlobalDashboardOverview(@Query() timeRange: TimeRangeDto) {
    return this.analyticsService.getGlobalDashboardOverview(timeRange);
  }
}
