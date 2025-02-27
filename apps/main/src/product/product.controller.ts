import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
} from './dto/product.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('product')
@ApiTags('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建闲置物品' })
  async create(@Body() data: CreateProductDto) {
    return this.productService.create(data);
  }

  @Put(':id')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新闲置物品' })
  async update(@Param('id') id: string, @Body() data: UpdateProductDto) {
    return this.productService.update(id, data);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除闲置物品' })
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取闲置物品详情' })
  async findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Get()
  @ApiOperation({ summary: '获取闲置物品列表' })
  async findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '获取用户的闲置物品列表' })
  async findByUserId(
    @Param('userId') userId: string,
    @Query() query: QueryProductDto,
  ) {
    return this.productService.findByUserId(userId, query);
  }

  @Put(':id/verify')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '审核闲置物品' })
  async verify(
    @Param('id') id: string,
    @Body('status') status: 'VERIFIED' | 'REJECTED',
  ) {
    return this.productService.verify(id, status);
  }
}
