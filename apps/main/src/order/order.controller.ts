import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('order')
@ApiTags('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: '创建订单' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }
  @Get('counts/:userId')
  @ApiOperation({ summary: '获取当前用户各状态订单数量' })
  getOrderCounts(@Param('userId') userId: string) {
    return this.orderService.getOrderCounts(userId);
  }
  @Get(':userId')
  @ApiOperation({ summary: '获取当前用户的订单列表' })
  findAll(@Param('userId') userId: string, @Query() query) {
    return this.orderService.findByUserId(userId, query);
  }

  // @Get(':id')
  // @ApiOperation({ summary: '获取订单详情' })
  // findOne(@Param('id') id: string, @User('id') userId: string) {
  //   return this.orderService.findOne(id, userId);
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: '取消订单' })
  // remove(@Param('id') id: string, @User('id') userId: string) {
  //   return this.orderService.cancelOrder(id, userId);
  // }
}
