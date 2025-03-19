import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto, QueryPostDto } from './dto/post.dto';
import { Request } from 'express';

@ApiTags('post')
@Controller('post')
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

  @Post(':id/like')
  @ApiOperation({ summary: '点赞/取消点赞帖子' })
  @ApiParam({ name: 'id', description: '帖子ID' })
  async likePost(@Param('id') id: string, @Body() body: { userId: string }) {
    const { userId } = body;
    return this.postService.likePost(id, userId);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: '收藏/取消收藏帖子' })
  @ApiParam({ name: 'id', description: '帖子ID' })
  async favoritePost(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    const { userId } = body;
    return this.postService.favoritePost(id, userId);
  }

  @Post(':id/view')
  @ApiOperation({ summary: '记录帖子浏览' })
  @ApiParam({ name: 'id', description: '帖子ID' })
  async recordView(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: { deviceId?: string; userId?: string },
  ) {
    const { userId, deviceId } = body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.postService.recordView(id, userId, deviceId, ip, userAgent);
  }

  // @Post(':id/comment')
  // @ApiOperation({ summary: '发表评论' })
  // @ApiParam({ name: 'id', description: '帖子ID' })
  // async addComment(
  //   @Param('id') id: string,
  //   @Body() body: { content: string; replyTo?: string; userId: string },
  // ) {
  //   const { userId, content, replyTo } = body;
  //   return this.postService.coment;
  // }
}
