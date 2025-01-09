import { Controller, Get } from '@nestjs/common';
import { ProductService } from './product.service';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('users')
  @ApiQuery({
    name: 'page',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'The found records',
    type: [String],
  })
  async getUsers(page: number, limit: number) {
    return await this.productService.findUserList(page, limit);
  }
}
