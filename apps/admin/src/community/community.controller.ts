import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { LoginGuard } from 'apps/common/guards/auth.guard';

@Controller('community')
@ApiTags('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post()
  @ApiBody({
    type: CreateCommunityDto,
  })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
  })
  create(@Body() createCommunityDto: CreateCommunityDto) {
    return this.communityService.create(createCommunityDto);
  }

  @Get()
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
  @ApiResponse({
    status: 200,
    description: 'The found records',
  })
  findAll(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('name') name?: string,
  ) {
    return this.communityService.findAll({ page, pageSize, name });
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.communityService.findOne(id);
  // }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCommunityDto: UpdateCommunityDto,
  ) {
    return this.communityService.update(id, updateCommunityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.communityService.remove(id);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取社区层级树结构' })
  @ApiResponse({
    status: 200,
    description: '返回完整的社区层级结构树',
  })
  getCommunityTree() {
    return this.communityService.getCommunityTree();
  }

  @Get('by-level/:level')
  @ApiOperation({ summary: '获取指定级别的社区列表' })
  @ApiParam({
    name: 'level',
    description: '社区级别 (1-市，2-区，3-街道，4-社区)',
  })
  @ApiResponse({
    status: 200,
    description: '返回指定级别的社区列表',
  })
  getCommunityByLevel(@Param('level') level: string) {
    return this.communityService.getCommunityByLevel(Number(level));
  }

  @Get('under-district/:districtId')
  @ApiOperation({ summary: '获取指定区下辖的街道和社区' })
  @ApiParam({
    name: 'districtId',
    description: '区级行政单位ID',
    required: true,
  })
  @ApiQuery({
    name: 'includeStreets',
    description: '是否包含街道数据，默认为true',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeCommunities',
    description: '是否包含社区数据，默认为true',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: '返回该区下辖的街道和社区数据',
  })
  getDistrictSubordinates(
    @Param('districtId') districtId: string,
    @Query('includeStreets') includeStreets?: string,
    @Query('includeCommunities') includeCommunities?: string,
  ) {
    const shouldIncludeStreets = includeStreets !== 'false';
    const shouldIncludeCommunities = includeCommunities !== 'false';

    return this.communityService.getDistrictSubordinates(
      districtId,
      shouldIncludeStreets,
      shouldIncludeCommunities,
    );
  }
}
