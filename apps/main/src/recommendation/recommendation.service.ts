import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { guid, ResultData } from '@app/common';
import { ProductVectorService } from '../product/product-vector.service';
import { BehaviorService } from '../behavior/behavior.service';
import { RecommendationType } from '@prisma/client';
import { EmbeddingService } from '../embedding/embedding.service';
import { ChromaService } from '@app/chroma';

@Injectable()
export class RecommendationService {
  private productCollection: any;

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => ProductVectorService))
    private productVectorService: ProductVectorService,
    private behaviorService: BehaviorService,
    private embeddingService: EmbeddingService,
    private chromaService: ChromaService,
  ) {
    this.initializeCollection();
  }

  private async initializeCollection() {
    this.productCollection = await this.chromaService.getOrCreateCollection({
      name: 'products',
      embeddingFunction: {
        generate: async (texts: string[]) =>
          this.embeddingService.batchEmbed(texts),
      },
    });
  }

  // 从recommend.service.ts合并过来的索引方法
  async indexProduct(product: any) {
    const embedding = await this.embeddingService.generateEmbedding(
      `${product.name}: ${product.description}`,
    );

    await this.productCollection.add({
      ids: [product.id.toString()],
      embeddings: [embedding],
      metadatas: [
        {
          category: product.category,
          price: product.price,
        },
      ],
    });

    return ResultData.ok(null, '商品索引成功');
  }

  // 从recommend.service.ts合并的相似搜索方法
  async recommendSimilarByQuery(
    query: string,
    filters = {},
    limit: number = 10,
  ) {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    const results = await this.productCollection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      where: filters,
    });

    // 将 ID 和距离组合成对象数组，便于排序
    const productsWithDistances = results.ids[0].map(
      (id: string, index: number) => ({
        id,
        distance: results.distances[0][index],
      }),
    );

    // 按距离升序排序（距离越小越相似）
    productsWithDistances.sort((a, b) => a.distance - b.distance);

    // 获取排序后的 ID 数组
    const sortedProductIds = productsWithDistances.map((p) => p.id);

    // 使用 Prisma 查询，并保持排序顺序
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: sortedProductIds },
        status: 'VERIFIED',
      },
    });

    // 根据 sortedProductIds 的顺序重新排序查询结果
    const sortedProducts = sortedProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);

    return ResultData.ok(sortedProducts);
  }

  // 保留原有的getSimilarProducts方法，但内部实现可以复用ProductVectorService
  async getSimilarProducts(productId: string, limit: number = 6) {
    try {
      // 1. 先获取商品信息
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return ResultData.fail(404, '商品不存在');
      }

      // 2. 使用向量搜索获取相似商品
      const content = `${product.name} ${product.description}`;
      const similarProductIds =
        await this.productVectorService.searchSimilarProducts(
          content,
          limit + 1, // 多获取一个，因为可能包含自身
        );

      // 过滤掉自身
      const filteredIds = similarProductIds.filter((id) => id !== productId);

      // 3. 获取相似商品详情
      const similarProducts = await this.prisma.product.findMany({
        where: {
          id: { in: filteredIds },
          status: 'VERIFIED',
        },
        take: limit,
      });

      return ResultData.ok(similarProducts);
    } catch (error) {
      console.error('获取相似商品失败:', error);
      return ResultData.fail(500, '获取相似商品失败');
    }
  }

  // 从recommend.service.ts合并的删除方法
  async deleteProduct(productIds: string[], filters = {}) {
    try {
      await this.productCollection.delete({
        ids: productIds,
        where: filters,
      });
      return ResultData.ok(null, '删除索引成功');
    } catch (error) {
      console.error('删除索引失败:', error);
      return ResultData.fail(500, '删除索引失败');
    }
  }

  /**
   * 获取用户个性化推荐
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10,
    communityId?: string,
  ) {
    try {
      // 1. 尝试从缓存获取推荐结果
      const cacheKey = `recommendations:${userId}`;
      let recommendations = await this.cacheManager.get<string[]>(cacheKey);

      // 如果缓存中没有推荐结果，则生成新的推荐
      if (!recommendations || recommendations.length === 0) {
        recommendations = await this.generateRecommendations(
          userId,
          limit,
          communityId,
        );

        // 缓存推荐结果，设置1小时过期时间
        await this.cacheManager.set(cacheKey, recommendations, 3600);
      }

      // 2. 获取推荐商品详情
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: recommendations },
          status: 'VERIFIED',
          ...(communityId && { communityId }),
        },
        take: limit,
      });

      // 3. 记录这些推荐到数据库，用于分析推荐效果
      const recommendationEntries = recommendations.map((productId, index) => ({
        id: guid(),
        userId,
        productId,
        score: 1 - index * (0.9 / recommendations.length), // 分数递减
        type: RecommendationType.HYBRID,
        createdAt: new Date(),
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
      }));

      await this.prisma.recommendation.createMany({
        data: recommendationEntries,
        skipDuplicates: true,
      });

      return ResultData.ok(products);
    } catch (error) {
      console.error('获取个性化推荐失败:', error);

      // 如果出错，返回热门商品作为备选
      const fallbackProducts = await this.getPopularProducts(
        limit,
        communityId,
      );
      return ResultData.ok(fallbackProducts);
    }
  }

  /**
   * 生成用户个性化推荐
   * 使用混合策略：内容相似 + 协同过滤 + 热门商品
   */
  private async generateRecommendations(
    userId: string,
    limit: number,
    communityId?: string,
  ): Promise<string[]> {
    // 1. 获取用户最近行为数据
    const recentBehavior =
      await this.behaviorService.getUserRecentBehavior(userId);

    // 推荐结果集
    const recommendedProducts = new Set<string>();

    // 2. 基于最近搜索和浏览记录，使用向量相似度推荐（内容相似）
    if (recentBehavior.recentSearch) {
      const contentBasedIds =
        await this.productVectorService.searchSimilarProducts(
          recentBehavior.recentSearch,
          Math.round(limit * 0.4), // 约40%的推荐基于内容相似
        );

      contentBasedIds.forEach((id) => recommendedProducts.add(id));
    }

    // 3. 基于用户历史行为，使用协同过滤推荐
    const userBehaviors = await this.prisma.userBehavior.findMany({
      where: {
        userId,
        type: { in: ['PURCHASE', 'VIEW', 'CART_ADD'] },
      },
      orderBy: { weight: 'desc' },
      take: 20,
    });

    // 获取用户最感兴趣的商品ID
    const interestedProductIds = userBehaviors.map((b) => b.productId);

    if (interestedProductIds.length > 0) {
      // 找到与这些商品相似的其他用户也喜欢的商品
      const similarUserProducts = await this.prisma.userBehavior.findMany({
        where: {
          productId: { in: interestedProductIds },
          userId: { not: userId },
          type: { in: ['PURCHASE', 'CART_ADD'] },
        },
        distinct: ['userId'],
        take: 10,
      });

      const similarUserIds = similarUserProducts.map((p) => p.userId);

      if (similarUserIds.length > 0) {
        // 获取这些相似用户喜欢的其他商品
        const collaborativeProducts = await this.prisma.userBehavior.findMany({
          where: {
            userId: { in: similarUserIds },
            productId: { notIn: interestedProductIds }, // 排除用户已经交互过的商品
            type: { in: ['PURCHASE', 'CART_ADD'] },
          },
          orderBy: { weight: 'desc' },
          take: Math.round(limit * 0.4), // 约40%的推荐基于协同过滤
        });

        collaborativeProducts.forEach((p) =>
          recommendedProducts.add(p.productId),
        );
      }
    }

    // 4. 补充热门商品，确保有足够的推荐结果
    if (recommendedProducts.size < limit) {
      const remainingCount = limit - recommendedProducts.size;
      const hotProducts = await this.prisma.product.findMany({
        where: {
          status: 'VERIFIED',
          id: { notIn: Array.from(recommendedProducts) },
          ...(communityId && { communityId }),
        },
        orderBy: { purchaseCount: 'desc' },
        take: remainingCount,
      });

      hotProducts.forEach((p) => recommendedProducts.add(p.id));
    }

    return Array.from(recommendedProducts);
  }

  /**
   * 获取热门商品（备选推荐）
   */
  private async getPopularProducts(limit: number, communityId?: string) {
    return this.prisma.product.findMany({
      where: {
        status: 'VERIFIED',
        ...(communityId && { communityId }),
      },
      orderBy: [{ purchaseCount: 'desc' }, { viewCount: 'desc' }],
      take: limit,
    });
  }

  /**
   * 更新用户推荐缓存
   * 当用户有重要行为变化时调用(如购买行为)
   */
  async invalidateUserRecommendations(userId: string) {
    const cacheKey = `recommendations:${userId}`;
    await this.cacheManager.del(cacheKey);
  }
}
