import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
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

  // 创建回复评论
  async createReply(data: CreateReplyCommentDto) {
    try {
      // 验证原始评论是否存在
      const originalComment = await this.prisma.comment.findUnique({
        where: { id: data.commentId },
      });

      if (!originalComment) {
        throw new HttpException('原始评论不存在', HttpStatus.NOT_FOUND);
      }

      // 验证被回复评论是否存在
      const replyToComment = await this.prisma.comment.findUnique({
        where: { id: data.replyToId },
      });

      if (!replyToComment) {
        throw new HttpException('被回复评论不存在', HttpStatus.NOT_FOUND);
      }

      const reply = await this.prisma.replyComment.create({
        data: {
          content: data.content,
          userId: data.userId,
          commentId: data.commentId,
          replyToId: data.replyToId,
          replyToUserId: data.replyToUserId,
        },
      });

      return ResultData.ok(reply);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || '创建回复失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 更新回复评论
  async updateReply(id: string, data: UpdateReplyCommentDto) {
    try {
      const reply = await this.prisma.replyComment.findUnique({
        where: { id },
      });

      if (!reply) {
        throw new HttpException('回复不存在', HttpStatus.NOT_FOUND);
      }

      if (reply.userId !== data.userId) {
        throw new HttpException('无权修改此回复', HttpStatus.FORBIDDEN);
      }

      const updated = await this.prisma.replyComment.update({
        where: { id },
        data: {
          content: data.content,
          updateTime: new Date(),
        },
      });

      return ResultData.ok(updated);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || '更新回复失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 删除回复评论
  async deleteReply(id: string, userId: string) {
    try {
      const reply = await this.prisma.replyComment.findUnique({
        where: { id },
      });

      if (!reply) {
        throw new HttpException('回复不存在', HttpStatus.NOT_FOUND);
      }

      if (reply.userId !== userId) {
        throw new HttpException('无权删除此回复', HttpStatus.FORBIDDEN);
      }

      await this.prisma.replyComment.delete({
        where: { id },
      });

      return ResultData.ok(null, '删除成功');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || '删除回复失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 获取评论的所有回复
  async findAllReplies(query: QueryReplyCommentDto) {
    try {
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;

      const where = {
        ...(query.commentId && { commentId: query.commentId }),
        ...(query.replyToId && { replyToId: query.replyToId }),
      };

      const [total, items] = await Promise.all([
        this.prisma.replyComment.count({ where }),
        this.prisma.replyComment.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: Number(pageSize),
          orderBy: { createTime: 'asc' },
        }),
      ]);

      return ResultData.ok({
        items,
        total,
        page,
        pageSize,
      });
    } catch (error) {
      throw new HttpException(
        error.message || '获取回复列表失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 获取评论树（包含回复）
  async getCommentTree(commentId: string) {
    try {
      // 获取原始评论
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new HttpException('评论不存在', HttpStatus.NOT_FOUND);
      }

      // 获取所有回复
      const replies = await this.prisma.replyComment.findMany({
        where: { commentId },
        orderBy: { createTime: 'asc' },
      });

      // 构建回复树
      const replyMap = new Map();
      const rootReplies = [];

      // 将回复按照ID映射
      replies.forEach((reply) => {
        replyMap.set(reply.id, {
          ...reply,
          children: [],
        });
      });

      // 构建树结构
      replies.forEach((reply) => {
        // 如果回复的是原始评论
        if (reply.replyToId === commentId) {
          rootReplies.push(replyMap.get(reply.id));
        } else {
          // 回复的是其他回复
          const parent = replyMap.get(reply.replyToId);
          if (parent) {
            parent.children.push(replyMap.get(reply.id));
          }
        }
      });

      return ResultData.ok({
        comment,
        replies: rootReplies,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || '获取评论树失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
