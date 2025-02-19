import { Controller, Get, Post, Body, Query, Delete } from '@nestjs/common';
import { RecommendationsService } from './recommend.service';
import { IndexProductDto } from './dto/index-product.dto';
import { ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('recommend')
@ApiTags('recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendationsService) {}

  @Post('index')
  @ApiBody({ type: IndexProductDto })
  @ApiResponse({ status: 201, description: 'Product indexed successfully' })
  async indexProduct(@Body() indexProductDto: IndexProductDto) {
    await this.recommendService.indexProduct(indexProductDto);
    return { message: 'Product indexed successfully' };
  }

  @Get('similar')
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'filters', required: false, type: Object })
  @ApiResponse({ status: 200, description: 'Similar products retrieved' })
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
  @ApiQuery({ name: 'ids', required: true })
  @ApiQuery({ name: 'filters', required: false })
  @ApiResponse({ status: 200, description: 'index deleted' })
  async deleteCollection(
    @Query('ids') ids: string,
    @Query('filters') filters: string,
  ) {
    const idsArray = ids.split(',');
    return await this.recommendService.deleteProduct(idsArray, filters);
  }
}
