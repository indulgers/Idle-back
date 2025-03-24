import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PointService } from './point.service';
import { CreatePointDto, QueryPointDto } from './dto/point.dto';

@Controller('point')
@ApiTags('point')
export class PointController {
  constructor(private readonly pointService: PointService) {}

  @Post()
  @ApiOperation({ summary: '创建积分记录' })
  async create(@Body() createPointDto: CreatePointDto) {
    return this.pointService.create(createPointDto);
  }

  @Get()
  @ApiOperation({ summary: '获取积分记录列表' })
  async findAll(@Query() query: QueryPointDto) {
    return this.pointService.findAll(query);
  }

  @Get('user/:userId/total')
  @ApiOperation({ summary: '获取用户积分总额' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  async getUserTotalPoints(@Param('userId') userId: string) {
    return this.pointService.getUserTotalPoints(userId);
  }

  @Get('user/:userId/validate')
  @ApiOperation({ summary: '验证用户积分是否足够' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiQuery({ name: 'requiredPoints', description: '所需积分', type: Number })
  async validateUserPoints(
    @Param('userId') userId: string,
    @Query('requiredPoints') requiredPoints: number,
  ) {
    return this.pointService.validateUserPoints(userId, Number(requiredPoints));
  }

  @Post('transaction')
  @ApiOperation({ summary: '执行积分交易' })
  async executePointTransaction(
    @Body() data: { userId: string; amount: number; description?: string },
  ) {
    const { userId, amount, description } = data;
    return this.pointService.executePointTransaction(
      userId,
      amount,
      description,
    );
  }
}
