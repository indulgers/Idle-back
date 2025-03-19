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
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

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

  @Get('seller/counts/:sellerId')
  @ApiOperation({ summary: '获取商家各状态订单数量' })
  getSellerOrderCounts(
    @Param('sellerId') sellerId: string,
    @Query() query: { page?: number; pageSize?: number; status?: string },
  ) {
    return this.orderService.getSellerOrderCounts(sellerId, query);
  }

  @Get('seller/:id')
  @ApiOperation({ summary: '获取商家订单列表' })
  @ApiParam({ name: 'id', description: '商家ID' })
  @ApiQuery({
    name: 'status',
    description: '订单状态',
    required: false,
    enum: ['PENDING', 'PAID', 'SHIPPING', 'COMPLETED', 'CANCELLED', 'DELETED'],
  })
  findSellerOrders(
    @Param('id') sellerId: string,
    @Query() query: { page?: number; pageSize?: number; status?: string },
  ) {
    return this.orderService.findSellerOrders(sellerId, query);
  }

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

  @Put(':id/update-status')
  @ApiOperation({ summary: '商家更新订单状态' })
  @ApiParam({ name: 'id', description: '订单ID' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() updateData: { status: string; sellerId: string },
  ) {
    return this.orderService.updateOrderStatus(id, updateData);
  }
}
