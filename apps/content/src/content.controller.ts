import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
// import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';

@ApiTags('content')
@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @ApiOperation({ summary: '获取内容服务状态' })
  getStatus() {
    return {
      status: 'ok',
      service: 'content',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  healthCheck() {
    return {
      status: 'ok',
      service: 'content',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('proxy/:module/:method')
  @ApiOperation({ summary: '代理调用内容服务的方法' })
  @ApiBearerAuth()
  async proxyCall(
    @Param('module') module: string,
    @Param('method') method: string,
    @Body() data: any,
  ) {
    return this.contentService.proxyCall(module, method, data);
  }
}
