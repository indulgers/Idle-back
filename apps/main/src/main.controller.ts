import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { MainService } from './main.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
// import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';

@ApiTags('main')
@Controller()
export class MainController {
  constructor(
    private readonly mainService: MainService,
    @Inject('CONTENT_SERVICE') private readonly contentClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取主服务状态' })
  getStatus() {
    return {
      status: 'ok',
      service: 'main',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  healthCheck() {
    return {
      status: 'ok',
      service: 'main',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('content/:module/:method')
  @ApiOperation({ summary: '转发请求到内容服务' })
  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  async forwardToContentService(
    @Param('module') module: string,
    @Param('method') method: string,
    @Body() data: any,
  ) {
    return this.mainService.forwardToContentService(module, method, data);
  }
}
