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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  QueryCommentDto,
} from './dto/comment.dto';

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
}
