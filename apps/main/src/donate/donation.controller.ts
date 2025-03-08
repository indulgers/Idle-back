import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { DonationService } from './donation.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
import { QueryDonationDto } from './dto/query-donation.dto';
import { ClaimDonationDto } from './dto/update-donation.dto';
import { FeedbackDonationDto } from './dto/update-donation.dto';
import { DonationStatus } from '@prisma/client';

@Controller('donation')
@ApiTags('donation')
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Post()
  @ApiOperation({ summary: '创建捐赠' })
  create(@Body() createDonationDto: CreateDonationDto) {
    return this.donationService.create(createDonationDto);
  }

  @Get()
  @ApiOperation({ summary: '获取捐赠列表' })
  findAll(@Query() query: QueryDonationDto) {
    return this.donationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取捐赠详情' })
  @ApiParam({ name: 'id', description: '捐赠ID' })
  findOne(@Param('id') id: string) {
    return this.donationService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新捐赠信息' })
  @ApiParam({ name: 'id', description: '捐赠ID' })
  update(
    @Param('id') id: string,
    @Body() updateDonationDto: UpdateDonationDto,
  ) {
    return this.donationService.update(id, updateDonationDto);
  }

  // @Put(':id/verify')
  // @ApiOperation({ summary: '审核捐赠' })
  // @ApiParam({ name: 'id', description: '捐赠ID' })
  // verify(
  //   @Param('id') id: string,
  //   @Body('status') status: DonationStatus,
  //   @Body('verifyNote') verifyNote: string,
  // ) {
  //   return this.donationService.verify(id, adminId, status, verifyNote);
  // }

  @Post('claim')
  @ApiOperation({ summary: '领取捐赠' })
  claim(@Body() claimDto: ClaimDonationDto) {
    return this.donationService.claim(claimDto);
  }

  // @Post('feedback')
  // @ApiOperation({ summary: '提交反馈' })
  // feedback(@Body() feedbackDto: FeedbackDonationDto) {
  //   return this.donationService.feedback(userId, feedbackDto);
  // }

  @Put(':id/cancel')
  @ApiOperation({ summary: '取消捐赠' })
  @ApiParam({ name: 'id', description: '捐赠ID' })
  cancel(@Query('userId') userId: string, @Query('id') id: string) {
    return this.donationService.cancel(id, userId);
  }
}
