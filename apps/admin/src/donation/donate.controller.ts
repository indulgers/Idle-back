import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { DonateService } from './donate.service';
import {
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ResultData } from '@app/common';
import { DonationStatus } from '@prisma/client';

@Controller('donation')
@ApiTags('donation')
export class DonateController {
  constructor(private readonly donateService: DonateService) {}

  @Post()
  @ApiOperation({ summary: '创建捐赠记录' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '物品名称' },
        description: { type: 'string', description: '物品描述' },
        categoryId: { type: 'string', description: '分类ID' },
        pointValue: { type: 'number', description: '所需积分值' },
        images: {
          type: 'array',
          items: { type: 'string' },
          description: '图片列表',
        },
        userId: { type: 'string', description: '用户ID' },
        communityId: { type: 'string', description: '社区ID' },
        tags: { type: 'string', description: '标签', nullable: true },
        location: { type: 'string', description: '位置', nullable: true },
      },
      required: [
        'name',
        'description',
        'categoryId',
        'images',
        'userId',
        'communityId',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: '捐赠记录创建成功',
  })
  create(@Body() createDonationDto: any) {
    return this.donateService.create(createDonationDto);
  }

  @Get()
  @ApiOperation({ summary: '获取捐赠列表' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: '每页数量',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: DonationStatus,
    description: '状态',
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    type: String,
    description: '关键词',
  })
  @ApiQuery({
    name: 'communityId',
    required: false,
    type: String,
    description: '社区ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: '分类ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: '开始日期',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: '结束日期',
  })
  @ApiResponse({
    status: 200,
    description: '获取捐赠列表成功',
  })
  findAll(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('status') status: DonationStatus,
    @Query('keyword') keyword: string,
    @Query('communityId') communityId: string,
    @Query('categoryId') categoryId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.donateService.findAll({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      status,
      keyword,
      communityId,
      categoryId,
      startDate,
      endDate,
    });
  }

  @Get('pending')
  @ApiOperation({ summary: '获取待审核捐赠列表' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: '每页数量',
  })
  @ApiResponse({
    status: 200,
    description: '获取待审核捐赠列表成功',
  })
  findPending(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    return this.donateService.findAll({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      status: DonationStatus.PENDING,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取捐赠详情' })
  @ApiParam({ name: 'id', description: '捐赠ID' })
  @ApiResponse({
    status: 200,
    description: '获取捐赠详情成功',
  })
  findOne(@Param('id') id: string) {
    return this.donateService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新捐赠信息' })
  @ApiParam({ name: 'id', description: '捐赠ID' })
  @ApiResponse({
    status: 200,
    description: '更新捐赠信息成功',
  })
  update(@Param('id') id: string, @Body() updateDonationDto: any) {
    return this.donateService.update(id, updateDonationDto);
  }

  @Put(':id/verify')
  @ApiOperation({ summary: '审核捐赠' })
  @ApiParam({ name: 'id', description: '捐赠ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['APPROVED', 'REJECTED'],
          description: '审核结果',
        },
        verifyNote: { type: 'string', description: '审核备注' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '审核捐赠成功',
  })
  verify(
    @Param('id') id: string,
    @Body('status') status: DonationStatus,
    @Body('verifyNote') verifyNote: string,
  ) {
    return this.donateService.verify(id, status, verifyNote);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: '管理员取消捐赠' })
  @ApiParam({ name: 'id', description: '捐赠ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: '取消原因' },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '取消捐赠成功',
  })
  adminCancel(@Param('id') id: string, @Body('reason') reason: string) {
    return this.donateService.adminCancel(id, reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除捐赠记录' })
  @ApiParam({ name: 'id', description: '捐赠ID' })
  @ApiResponse({
    status: 200,
    description: '删除捐赠记录成功',
  })
  remove(@Param('id') id: string) {
    return this.donateService.remove(id);
  }
}
