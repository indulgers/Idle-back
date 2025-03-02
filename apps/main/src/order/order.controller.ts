import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Put,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';

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
  getOrderCounts(
    @Param('userId') userId: string,
    @Query() query: { page?: number; pageSize?: number; status?: string },
  ) {
    return this.orderService.getOrderCounts(userId, query);
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

  @Delete(':id')
  @ApiOperation({ summary: '取消订单' })
  remove(@Param('id') id: string) {
    return this.orderService.cancelOrder(id);
  }

  @Put(':id/payment-success')
  @ApiOperation({ summary: '处理订单支付成功' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiBody({ description: '支付信息（可选）', required: false })
  updatePaymentSuccess(@Param('id') id: string, @Body() paymentInfo?: any) {
    return this.orderService.updatePaymentSuccess(id, paymentInfo);
  }
}
