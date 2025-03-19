import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TimeRangeDto } from './dto/analytics.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取仪表盘概览数据' })
  @ApiBearerAuth()
  async getDashboardOverview(@Query() timeRange: TimeRangeDto) {
    return this.analyticsService.getDashboardOverview(timeRange);
  }
}
