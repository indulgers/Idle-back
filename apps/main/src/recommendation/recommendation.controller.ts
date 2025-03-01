import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service';
import { IndexProductDto } from './dto/index-product.dto';

@Controller('recommendation')
@ApiTags('recommendation')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  // 从RecommendController合并的方法
  @Post('index')
  @ApiOperation({ summary: '索引商品到向量数据库' })
  @ApiBody({ type: IndexProductDto })
  @ApiResponse({ status: 201, description: '商品索引成功' })
  async indexProduct(@Body() indexProductDto: IndexProductDto) {
    return this.recommendationService.indexProduct(indexProductDto);
  }

  @Get('query')
  @ApiOperation({ summary: '根据关键词查询相似商品' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'filters', required: false })
  @ApiResponse({ status: 200, description: '查询相似商品成功' })
  async recommendSimilarByQuery(
    @Query('query') query: string,
    @Query('filters') filters: string,
    @Query('limit') limit?: number,
  ) {
    const filterObj = filters ? JSON.parse(filters) : {};
    return this.recommendationService.recommendSimilarByQuery(
      query,
      filterObj,
      limit ? Number(limit) : 10,
    );
  }

  @Delete('index')
  @ApiOperation({ summary: '删除商品索引' })
  @ApiQuery({ name: 'ids', required: true })
  @ApiQuery({ name: 'filters', required: false })
  @ApiResponse({ status: 200, description: '删除索引成功' })
  async deleteIndex(
    @Query('ids') ids: string,
    @Query('filters') filters: string,
  ) {
    const idsArray = ids.split(',');
    return this.recommendationService.deleteProduct(idsArray, filters);
  }

  // 原有方法
  @Get('personalized')
  @ApiOperation({ summary: '获取个性化推荐商品' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'communityId', required: false, type: String })
  async getPersonalizedRecommendations(
    @Query('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('communityId') communityId?: string,
  ) {
    return this.recommendationService.getPersonalizedRecommendations(
      userId,
      limit ? Number(limit) : 10,
      communityId,
    );
  }

  @Get('similar/:productId')
  @ApiOperation({ summary: '获取相似商品推荐' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSimilarProducts(
    @Param('productId') productId: string,
    @Query('limit') limit?: number,
  ) {
    return this.recommendationService.getSimilarProducts(
      productId,
      limit ? Number(limit) : 6,
    );
  }
}
