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
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
} from './dto/product.dto';
import { VerificationStatus } from '@prisma/client';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('product')
@ApiTags('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('search')
  @ApiOperation({ summary: '搜索商品' })
  @ApiQuery({ name: 'keyword', description: '搜索关键词', required: true })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiQuery({ name: 'communityId', description: '社区ID', required: false })
  @ApiQuery({ name: 'sortBy', description: '排序字段', required: false })
  @ApiQuery({
    name: 'sortOrder',
    description: '排序方向',
    required: false,
    enum: ['asc', 'desc'],
  })
  @ApiQuery({ name: 'minPrice', description: '最低价格', required: false })
  @ApiQuery({ name: 'maxPrice', description: '最高价格', required: false })
  @ApiQuery({ name: 'condition', description: '商品成色', required: false })
  @ApiQuery({ name: 'categoryId', description: '分类ID', required: false })
  async search(
    @Query('keyword') keyword: string,
    @Query() query: QueryProductDto,
  ) {
    return this.productService.search(keyword, query);
  }

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
  @ApiOperation({ summary: '审核闲置物品' })
  verify(@Param('id') id: string, @Body('status') status: VerificationStatus) {
    return this.productService.verify(id, status);
  }
}
