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
import { DonateService } from './donate.service';
import { ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCommunityDto } from '../community/dto/create-community.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
@Controller('donation')
@ApiTags('donation')
export class DonateController {
  constructor(private readonly donateService: DonateService) {}

  @Post()
  @ApiBody({
    type: CreateCommunityDto,
  })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
  })
  create(@Body() createDonationDto: any) {
    return this.donateService.create(createDonationDto);
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
  findAll(@Query('page') page: number, @Query('pageSize') pageSize: number) {
    return this.donateService.findAll({ page, pageSize });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.donateService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDonationDto: UpdateDonationDto,
  ) {
    return this.donateService.update(id, updateDonationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.donateService.remove(id);
  }
}
