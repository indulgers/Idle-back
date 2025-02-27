import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import {
  CreateCommentDto,
  UpdateCommentDto,
  QueryCommentDto,
} from './dto/comment.dto';
import { ResultData } from '@app/common';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCommentDto) {
    try {
      // 检查评论关联的是商品还是帖子
      if (!data.productId && !data.postId) {
        throw new HttpException(
          '必须指定商品ID或帖子ID',
          HttpStatus.BAD_REQUEST,
        );
      }

      const comment = await this.prisma.comment.create({
        data: {
          content: data.content,
          userId: data.userId,
          productId: data.productId,
          postId: data.postId,
        },
      });

      return ResultData.ok(comment);
    } catch (error) {
      throw new HttpException(
        error.message || '创建评论失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, data: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new HttpException('评论不存在', HttpStatus.NOT_FOUND);
    }

    if (comment.userId !== data.userId) {
      throw new HttpException('无权修改此评论', HttpStatus.FORBIDDEN);
    }

    const updated = await this.prisma.comment.update({
      where: { id },
      data: {
        content: data.content,
        updateTime: new Date(),
      },
    });

    return ResultData.ok(updated);
  }

  async delete(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new HttpException('评论不存在', HttpStatus.NOT_FOUND);
    }

    if (comment.userId !== userId) {
      throw new HttpException('无权删除此评论', HttpStatus.FORBIDDEN);
    }

    await this.prisma.comment.delete({
      where: { id },
    });

    return ResultData.ok(null, '删除成功');
  }

  async findAll(query: QueryCommentDto) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    const where = {
      ...(query.productId && { productId: query.productId }),
      ...(query.postId && { postId: query.postId }),
    };

    const [total, items] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: { createTime: 'desc' },
      }),
    ]);

    return ResultData.ok({
      items,
      total,
      page,
      pageSize,
    });
  }
}
