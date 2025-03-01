import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { guid } from '@app/common';
import { BehaviorType } from '@prisma/client';

@Injectable()
export class BehaviorService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * 记录用户搜索行为
   */
  async recordSearchBehavior(
    userId: string,
    keyword: string,
    clickedProductIds: string[] = [],
  ) {
    try {
      // 1. 记录搜索行为到Redis，用于实时个性化
      await this.cacheManager.set(
        `user:${userId}:recent_search`,
        keyword,
        3600 * 24, // 24小时过期
      );

      // 将搜索关键词加入最近搜索列表（Redis List结构）
      const searchListKey = `user:${userId}:search_history`;
      const client = await this.getCacheClient();
      await client.lpush(searchListKey, keyword);
      await client.ltrim(searchListKey, 0, 9); // 只保留最近10条

      // 2. 如果用户点击了搜索结果，增加关联度
      if (clickedProductIds.length > 0) {
        const promises = clickedProductIds.map((productId) =>
          this.prisma.userBehavior.upsert({
            where: {
              userId_productId_type: {
                userId,
                productId,
                type: BehaviorType.SEARCH_CLICK,
              },
            },
            update: {
              weight: { increment: 1 },
            },
            create: {
              id: guid(),
              userId,
              productId,
              type: BehaviorType.SEARCH_CLICK,
              weight: 1,
            },
          }),
        );

        await Promise.all(promises);
      }

      return true;
    } catch (error) {
      console.error('记录搜索行为失败:', error);
      return false;
    }
  }

  /**
   * 记录用户浏览行为
   */
  async recordViewBehavior(userId: string, productId: string) {
    try {
      // 1. 更新数据库记录
      await this.prisma.userBehavior.upsert({
        where: {
          userId_productId_type: {
            userId,
            productId,
            type: BehaviorType.VIEW,
          },
        },
        update: {
          weight: { increment: 0.5 }, // 浏览权重增加0.5
        },
        create: {
          id: guid(),
          userId,
          productId,
          type: BehaviorType.VIEW,
          weight: 1,
        },
      });

      // 2. 更新Redis中的最近浏览记录（使用Sorted Set，分数为时间戳）
      const viewedKey = `user:${userId}:recently_viewed`;
      const timestamp = Date.now();
      const client = await this.getCacheClient();
      await client.zadd(viewedKey, timestamp, productId);

      // 只保留最近20条记录
      await client.zremrangebyrank(viewedKey, 0, -21);

      // 设置24小时过期
      await client.expire(viewedKey, 3600 * 24);

      return true;
    } catch (error) {
      console.error('记录浏览行为失败:', error);
      return false;
    }
  }

  /**
   * 记录用户购买行为
   */
  async recordPurchaseBehavior(userId: string, productId: string) {
    try {
      // 购买行为权重最高
      await this.prisma.userBehavior.upsert({
        where: {
          userId_productId_type: {
            userId,
            productId,
            type: BehaviorType.PURCHASE,
          },
        },
        update: {
          weight: { increment: 5 }, // 购买权重增加5
        },
        create: {
          id: guid(),
          userId,
          productId,
          type: BehaviorType.PURCHASE,
          weight: 5,
        },
      });

      // 更新用户购买历史记录
      const purchaseHistoryKey = `user:${userId}:purchase_history`;
      const timestamp = Date.now();
      const client = await this.getCacheClient();
      await client.zadd(purchaseHistoryKey, timestamp, productId);

      return true;
    } catch (error) {
      console.error('记录购买行为失败:', error);
      return false;
    }
  }

  /**
   * 记录加入购物车行为
   */
  async recordCartAddBehavior(userId: string, productId: string) {
    try {
      await this.prisma.userBehavior.upsert({
        where: {
          userId_productId_type: {
            userId,
            productId,
            type: BehaviorType.CART_ADD,
          },
        },
        update: {
          weight: { increment: 2 }, // 加购权重增加2
        },
        create: {
          id: guid(),
          userId,
          productId,
          type: BehaviorType.CART_ADD,
          weight: 2,
        },
      });

      return true;
    } catch (error) {
      console.error('记录加购行为失败:', error);
      return false;
    }
  }

  /**
   * 获取用户最近行为数据
   */
  async getUserRecentBehavior(userId: string) {
    try {
      // 获取最近搜索关键词
      const recentSearch = await this.cacheManager.get<string>(
        `user:${userId}:recent_search`,
      );

      // 获取最近浏览记录
      const client = await this.getCacheClient();
      const recentlyViewed = await client.zrevrange(
        `user:${userId}:recently_viewed`,
        0,
        9,
      );

      // 获取最近搜索历史
      const searchHistory = await client.lrange(
        `user:${userId}:search_history`,
        0,
        9,
      );

      return {
        recentSearch,
        recentlyViewed,
        searchHistory,
      };
    } catch (error) {
      console.error('获取用户最近行为失败:', error);
      return {
        recentSearch: null,
        recentlyViewed: [],
        searchHistory: [],
      };
    }
  }

  /**
   * 辅助方法：获取Redis客户端
   */
  private async getCacheClient() {
    const store = await this.cacheManager.stores;
    return store[0].store.getClient();
  }
}
