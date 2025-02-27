import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { CreatePostDto, UpdatePostDto, QueryPostDto } from './dto/post.dto';
import { guid, ResultData } from '@app/common';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePostDto) {
    try {
      const post = await this.prisma.post.create({
        data: {
          id: guid(),
          userId: data.userId,
          title: data.title,
          content: data.content,
          images: JSON.stringify(data.images || []),
        },
      });

      return ResultData.ok(post);
    } catch (error) {
      throw new HttpException('创建帖子失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, data: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new HttpException('帖子不存在', HttpStatus.NOT_FOUND);
    }

    // if (post.userId !== userId) {
    //   throw new HttpException('无权修改此帖子', HttpStatus.FORBIDDEN);
    // }

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        images: JSON.stringify(data.images || []),
        updateTime: new Date(),
      },
    });

    return ResultData.ok(updated);
  }

  async delete(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new HttpException('帖子不存在', HttpStatus.NOT_FOUND);
    }

    // if (post.userId !== userId) {
    //   throw new HttpException('无权删除此帖子', HttpStatus.FORBIDDEN);
    // }

    await this.prisma.post.delete({
      where: { id },
    });

    return ResultData.ok(null, '删除成功');
  }

  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createTime: 'desc' },
          take: 10, // 默认获取最新的10条评论
        },
      },
    });

    if (!post) {
      throw new HttpException('帖子不存在', HttpStatus.NOT_FOUND);
    }

    return ResultData.ok({
      ...post,
      images: JSON.parse(post.images || '[]'),
    });
  }

  async findAll(query: QueryPostDto) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    const [total, items] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.post.findMany({
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: {
          createTime: 'desc',
        },
      }),
    ]);

    const posts = items.map((post) => ({
      ...post,
      images: JSON.parse(post.images || '[]'),
    }));

    return ResultData.ok({
      items: posts,
      total,
      page,
      pageSize,
    });
  }

  async findByUserId(userId: string, query: QueryPostDto) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    const [total, items] = await Promise.all([
      this.prisma.post.count({
        where: { userId },
      }),
      this.prisma.post.findMany({
        where: { userId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createTime: 'desc',
        },
      }),
    ]);

    const posts = items.map((post) => ({
      ...post,
      images: JSON.parse(post.images || '[]'),
    }));

    return ResultData.ok({
      items: posts,
      total,
      page,
      pageSize,
    });
  }
}
