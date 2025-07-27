import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  QueryCommentDto,
} from './dto/comment.dto';
import {
  CreateReplyCommentDto,
  UpdateReplyCommentDto,
  QueryReplyCommentDto,
} from './dto/reply-comment.dto';

@Controller('comment')
@ApiTags('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建评论' })
  async create(@Body() data: CreateCommentDto) {
    return this.commentService.create(data);
  }

  @Put(':id')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新评论' })
  async update(@Param('id') id: string, @Body() data: UpdateCommentDto) {
    return this.commentService.update(id, data);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除评论' })
  async delete(@Param('id') id: string, @Param('userId') userId: string) {
    return this.commentService.delete(id, userId);
  }

  @Get()
  @ApiOperation({ summary: '获取评论列表' })
  async findAll(@Query() query: QueryCommentDto) {
    return this.commentService.findAll(query);
  }

  @Post('reply')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建回复评论' })
  async createReply(@Body() data: CreateReplyCommentDto) {
    return this.commentService.createReply(data);
  }

  @Put('reply/:id')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新回复评论' })
  async updateReply(
    @Param('id') id: string,
    @Body() data: UpdateReplyCommentDto,
  ) {
    return this.commentService.updateReply(id, data);
  }

  @Delete('reply/:id/:userId')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除回复评论' })
  async deleteReply(@Param('id') id: string, @Param('userId') userId: string) {
    return this.commentService.deleteReply(id, userId);
  }

  @Get('reply')
  @ApiOperation({ summary: '获取回复评论列表' })
  async findAllReplies(@Query() query: QueryReplyCommentDto) {
    return this.commentService.findAllReplies(query);
  }

  @Get('tree/:id')
  @ApiOperation({ summary: '获取评论树' })
  @ApiParam({ name: 'id', description: '评论ID' })
  async getCommentTree(@Param('id') id: string) {
    return this.commentService.getCommentTree(id);
  }
}
