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
import { ProductService } from './product.service';
import { ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('product')
@ApiTags('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiBody({
    type: CreateProductDto,
  })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
  })
  create(@Body() createProductDto: any) {
    return this.productService.create(createProductDto);
  }

  @Get('list')
  @ApiQuery({
    name: 'page',
  })
  @ApiQuery({
    name: 'pageSize',
  })
  @ApiQuery({
    name: 'name',
    required: false,
  })
  @ApiQuery({
    name: 'communityId',
    required: false,
  })
  findAll(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('name') name?: string,
    @Query('communityId') communityId?: string,
  ) {
    return this.productService.findAll({ page, pageSize, name, communityId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @ApiBody({
    type: CreateProductDto,
  })
  update(@Param('id') id: string, @Body() updateProductDto: any) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
