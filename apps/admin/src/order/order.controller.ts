import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QueryOrderDto } from './dto/query-order.dto';

@Controller('order')
@ApiTags('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // @Post()
  // @ApiOperation({ summary: '创建订单(管理员不可用)' })
  // create(@Body() createOrderDto: CreateOrderDto) {
  //   return this.orderService.create(createOrderDto);
  // }

  @Get()
  @ApiOperation({ summary: '查询订单列表' })
  @ApiQuery({
    name: 'page',
    required: false,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
  })
  findAll(@Query() query: QueryOrderDto) {
    return this.orderService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询订单详情' })
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  // @Patch(':id')
  // @ApiOperation({ summary: '更新订单状态' })
  // update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
  //   return this.orderService.update(id, updateOrderDto);
  // }

  @Delete(':id')
  @ApiOperation({ summary: '删除订单' })
  remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }
}
