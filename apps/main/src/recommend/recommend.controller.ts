import { Controller, Get, Post, Body, Query, Delete } from '@nestjs/common';
import { RecommendationsService } from './recommend.service';
import { IndexProductDto } from './dto/index-product.dto';

@Controller('recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendationsService) {}

  @Post('index')
  async indexProduct(@Body() indexProductDto: IndexProductDto) {
    await this.recommendService.indexProduct(indexProductDto);
    return { message: 'Product indexed successfully' };
  }

  @Get('similar')
  async recommendSimilar(
    @Query('query') query: string,
    @Query('filters') filters: string,
  ) {
    const filterObj = filters ? JSON.parse(filters) : {};
    const products = await this.recommendService.recommendSimilar(
      query,
      filterObj,
    );
    return products;
  }
  @Delete('delete')
  async deleteCollection(
    @Query('ids') ids: string,
    @Query('filters') filters: string,
  ) {
    const idsArray = ids.split(',');
    return await this.recommendService.deleteProduct(idsArray, filters);
  }
}
