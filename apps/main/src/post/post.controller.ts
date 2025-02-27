import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto, QueryPostDto } from './dto/post.dto';

@Controller('post')
@ApiTags('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiOperation({ summary: '创建帖子' })
  async create(@Body() data: CreatePostDto) {
    return this.postService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新帖子' })
  async update(@Param('id') id: string, @Body() data: UpdatePostDto) {
    return this.postService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除帖子' })
  async delete(@Param('id') id: string) {
    return this.postService.delete(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取帖子详情' })
  async findById(@Param('id') id: string) {
    return this.postService.findById(id);
  }

  @Get()
  @ApiOperation({ summary: '获取帖子列表' })
  async findAll(@Query() query: QueryPostDto) {
    return this.postService.findAll(query);
  }

  @Get('list/:userId')
  @ApiOperation({ summary: '获取用户的帖子列表' })
  async findByUserId(
    @Param('userId') userId: string,
    @Query() query: QueryPostDto,
  ) {
    return this.postService.findByUserId(userId, query);
  }
}
