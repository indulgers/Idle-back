import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { PostVectorService } from './post-vector.service';
import { CreatePostDto, UpdatePostDto, QueryPostDto } from './dto/post.dto';
import { guid, ResultData } from '@app/common';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private postVectorService: PostVectorService,
  ) {}

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
      const content = `${post.title} ${post.content}`;
      await this.postVectorService.addOrUpdatePostEmbedding(post.id, content);
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
    if (data.title || data.content) {
      const content = `${updated.title} ${updated.content}`;
      await this.postVectorService.addOrUpdatePostEmbedding(id, content);
    }
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
    await this.postVectorService.deletePostEmbedding(id);

    return ResultData.ok(null, '删除成功');
  }

  // 新增方法: 记录帖子浏览
  async recordView(
    postId: string,
    userId?: string,
    deviceId?: string,
    ip?: string,
    userAgent?: string,
  ) {
    try {
      // 首先增加帖子的浏览计数
      await this.prisma.post.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      });

      // 如果需要记录详细的浏览行为，可以添加到 PostView 表
      if (userId || deviceId) {
        await this.prisma.postView.create({
          data: {
            id: guid(),
            postId,
            userId,
            deviceId,
            ip,
            userAgent,
          },
        });
      }

      return ResultData.ok(null, '记录浏览成功');
    } catch (error) {
      console.error('记录帖子浏览失败:', error);
      // 这里不抛出异常，确保即使记录失败也不影响用户体验
      return ResultData.fail(500, '记录浏览失败');
    }
  }

  // 新增方法: 点赞帖子
  async likePost(postId: string, userId: string) {
    try {
      // 检查用户是否已经点赞过该帖子
      const existingLike = await this.prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      if (existingLike) {
        // 如果已点赞，则取消点赞
        await this.prisma.postLike.delete({
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
        });

        // 减少帖子的点赞计数
        await this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        });

        return ResultData.ok(false, '取消点赞成功');
      } else {
        // 如果未点赞，则添加点赞
        await this.prisma.postLike.create({
          data: {
            id: guid(),
            postId,
            userId,
          },
        });

        // 增加帖子的点赞计数
        await this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        });

        return ResultData.ok(true, '点赞成功');
      }
    } catch (error) {
      console.error('操作点赞失败:', error);
      throw new HttpException('操作点赞失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 新增方法: 收藏帖子
  async favoritePost(postId: string, userId: string) {
    try {
      // 检查用户是否已经收藏过该帖子
      const existingFavorite = await this.prisma.postFavorite.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      if (existingFavorite) {
        // 如果已收藏，则取消收藏
        await this.prisma.postFavorite.delete({
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
        });

        // 减少帖子的收藏计数
        await this.prisma.post.update({
          where: { id: postId },
          data: { favoriteCount: { decrement: 1 } },
        });

        return ResultData.ok(false, '取消收藏成功');
      } else {
        // 如果未收藏，则添加收藏
        await this.prisma.postFavorite.create({
          data: {
            id: guid(),
            postId,
            userId,
          },
        });

        // 增加帖子的收藏计数
        await this.prisma.post.update({
          where: { id: postId },
          data: { favoriteCount: { increment: 1 } },
        });

        return ResultData.ok(true, '收藏成功');
      }
    } catch (error) {
      console.error('操作收藏失败:', error);
      throw new HttpException('操作收藏失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 检查用户是否点赞了该帖子
  async checkUserLiked(postId: string, userId: string) {
    if (!userId) return false;

    const like = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return !!like;
  }

  // 检查用户是否收藏了该帖子
  async checkUserFavorited(postId: string, userId: string) {
    if (!userId) return false;

    const favorite = await this.prisma.postFavorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return !!favorite;
  }

  // 重写 findById 方法，包含用户行为信息
  async findById(id: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createTime: 'desc' },
          take: 10, // 默认获取最新的10条评论
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            favorites: true,
            views: true,
          },
        },
      },
    });

    if (!post) {
      throw new HttpException('帖子不存在', HttpStatus.NOT_FOUND);
    }

    // 如果提供了用户ID，则查询用户是否点赞和收藏
    let isLiked = false;
    let isFavorited = false;

    if (userId) {
      // 异步并行查询用户行为
      const [likeStatus, favoriteStatus] = await Promise.all([
        this.checkUserLiked(id, userId),
        this.checkUserFavorited(id, userId),
      ]);

      isLiked = likeStatus;
      isFavorited = favoriteStatus;

      // 记录浏览行为
      this.recordView(id, userId).catch((err) =>
        console.error('记录浏览失败:', err),
      );
    }

    // 增强帖子数据，添加行为统计和用户行为标识
    return ResultData.ok({
      ...post,
      images: JSON.parse(post.images || '[]'),
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      favoriteCount: post.favoriteCount,
      commentCount: post._count.comments,
      isLiked,
      isFavorited,
    });
  }

  // 修改 findAll 和 findByUserId 方法同样可以增强返回数据
  // 这里仅展示 findAll 的修改示例
  // 修改 findAll 方法支持多条件查询和向量搜索
  async findAll(query: QueryPostDto, userId?: string) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const where: any = {};
    let orderBy: any = { createTime: 'desc' };

    // 处理话题分类筛选
    if (query.topic && query.topic !== 'all') {
      if (query.topic === 'hot') {
        // 热门排序逻辑
        orderBy = {
          likeCount: 'desc',
        };
      } else {
        // 按话题分类筛选
        where.topic = query.topic;
      }
    }

    // 处理社区ID筛选
    if (query.communityId) {
      where.communityId = query.communityId;
    }

    // 处理关键词搜索
    let postIds: string[] = [];
    if (query.keyword && query.keyword.trim()) {
      const keyword = query.keyword.trim();

      // 1. 先进行向量语义搜索
      const semanticIds = await this.postVectorService.searchSimilarPosts(
        keyword,
        50, // 搜索更多结果作为候选
      );

      // 2. 再进行关键词匹配搜索
      const keywordIds = await this.prisma.post
        .findMany({
          where: {
            OR: [
              { title: { contains: keyword } },
              { content: { contains: keyword } },
            ],
          },
          select: { id: true },
          take: 50,
        })
        .then((results) => results.map((r) => r.id));

      // 3. 合并两种搜索结果，向量搜索结果优先
      postIds = [...new Set([...semanticIds, ...keywordIds])];

      // 记录搜索行为
      this.recordSearchBehavior(keyword, postIds).catch((err) =>
        console.error('记录搜索行为失败:', err),
      );

      // 如果有搜索结果，添加到查询条件
      if (postIds.length > 0) {
        where.id = { in: postIds };
      }
    }

    // 应用排序条件
    if (query.sortBy) {
      if (query.sortBy === 'popular') {
        // 按热度排序：点赞数、评论数、收藏数的综合
        orderBy = { likeCount: query.sortOrder || 'desc' };
      } else if (
        ['createTime', 'viewCount', 'likeCount', 'favoriteCount'].includes(
          query.sortBy,
        )
      ) {
        orderBy = { [query.sortBy]: query.sortOrder || 'desc' };
      }
    }

    // 获取总数和分页数据
    const [total, items] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy,
        include: {
          _count: {
            select: { comments: true },
          },
        },
      }),
    ]);

    // 如果是向量搜索且返回结果需要按相关性排序
    let finalItems = items;
    if (postIds.length > 0 && query.sortBy === 'relevance') {
      // 按向量搜索结果的顺序排序
      finalItems = postIds
        .map((id) => items.find((post) => post.id === id))
        .filter(Boolean);
    }

    // 如果提供了用户ID，查询用户行为
    let userLikes = new Set();
    let userFavorites = new Set();

    if (userId) {
      const postIds = items.map((post) => post.id);

      // 批量查询用户行为
      const [likes, favorites] = await Promise.all([
        this.prisma.postLike.findMany({
          where: {
            userId,
            postId: { in: postIds },
          },
          select: { postId: true },
        }),
        this.prisma.postFavorite.findMany({
          where: {
            userId,
            postId: { in: postIds },
          },
          select: { postId: true },
        }),
      ]);

      userLikes = new Set(likes.map((like) => like.postId));
      userFavorites = new Set(favorites.map((favorite) => favorite.postId));
    }

    // 增强帖子数据
    const posts = finalItems.map((post) => ({
      ...post,
      images: JSON.parse(post.images || '[]'),
      commentCount: post._count.comments,
      isLiked: userId ? userLikes.has(post.id) : false,
      isFavorited: userId ? userFavorites.has(post.id) : false,
      // 为前端添加额外信息
      topic: post.topic || '未分类',
      author: `用户${post.userId.substring(0, 6)}`, // 简化展示，实际应查询用户信息
      avatarUrl: 'https://img.yzcdn.cn/vant/cat.jpeg', // 默认头像
      location: '附近', // 默认位置
      shares: Math.floor(Math.random() * 20), // 模拟分享数，实际应有专门字段
    }));

    return ResultData.ok({
      items: posts,
      total,
      page,
      pageSize,
    });
  }

  // 添加记录搜索行为的方法
  private async recordSearchBehavior(keyword: string, resultIds: string[]) {
    // TODO: 实现搜索行为记录，可用于个性化推荐
    console.log(`记录搜索行为: ${keyword}, 结果数: ${resultIds.length}`);
    return true;
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

  // 在 PostService 类中添加此方法
  async getUserFavorites(userId: string, query: QueryPostDto) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    try {
      const [total, items] = await Promise.all([
        this.prisma.postFavorite.count({
          where: { userId },
        }),
        this.prisma.postFavorite.findMany({
          where: { userId },
          orderBy: { createTime: 'desc' },
          skip: (page - 1) * pageSize,
          take: Number(pageSize),
          include: {
            post: {
              include: {
                _count: {
                  select: { comments: true },
                },
              },
            },
          },
        }),
      ]);

      // 确保 post 存在，有些收藏的帖子可能已被删除
      const posts = items
        .filter((item) => item.post)
        .map((item) => ({
          ...item.post,
          images: JSON.parse(item.post.images || '[]'),
          commentCount: item.post._count.comments,
          isLiked: true, // 用户已收藏的帖子，我们假设也点过赞
          isFavorited: true, // 这是从收藏夹中查询的，所以一定是已收藏
        }));

      return ResultData.ok({
        items: posts,
        total,
        page,
        pageSize,
      });
    } catch (error) {
      console.error('获取用户收藏帖子失败:', error);
      throw new HttpException(
        '获取收藏帖子失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
