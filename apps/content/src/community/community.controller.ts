import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommunityService } from './community.service';

@Controller('community')
@ApiTags('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('by-level/:level')
  @ApiOperation({ summary: '获取指定级别的社区列表' })
  @ApiParam({
    name: 'level',
    description: '社区级别 (1-市，2-区，3-街道，4-社区)',
  })
  async getCommunityByLevel(@Param('level') level: string) {
    return await this.communityService.getCommunityByLevel(Number(level));
  }

  @Get('under-district/:districtId')
  @ApiOperation({ summary: '获取指定区下辖的街道和社区' })
  @ApiParam({
    name: 'districtId',
    description: '区级行政单位ID',
  })
  @ApiQuery({
    name: 'includeStreets',
    description: '是否包含街道数据，默认为true',
    required: false,
  })
  @ApiQuery({
    name: 'includeCommunities',
    description: '是否包含社区数据，默认为true',
    required: false,
  })
  async getDistrictSubordinates(
    @Param('districtId') districtId: string,
    @Query('includeStreets') includeStreets?: string,
    @Query('includeCommunities') includeCommunities?: string,
  ) {
    const shouldIncludeStreets = includeStreets !== 'false';
    const shouldIncludeCommunities = includeCommunities !== 'false';

    return await this.communityService.getDistrictSubordinates(
      districtId,
      shouldIncludeStreets,
      shouldIncludeCommunities,
    );
  }

  @Get('tree')
  @ApiOperation({ summary: '获取社区层级树结构' })
  async getCommunityTree() {
    return await this.communityService.getCommunityTree();
  }

  @Get('search')
  @ApiOperation({ summary: '搜索社区' })
  @ApiQuery({
    name: 'keyword',
    description: '搜索关键词',
    required: true,
  })
  async searchCommunities(@Query('keyword') keyword: string) {
    return await this.communityService.searchCommunities(keyword);
  }
}
