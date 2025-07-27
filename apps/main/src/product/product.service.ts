import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
} from './dto/product.dto';
import { guid, ResultData } from '@app/common';
import { ProductVectorService } from './product-vector.service';
import { BehaviorService } from '../behavior/behavior.service';
import { Prisma, VerificationStatus } from '@prisma/client';
import { buildSearchConditions } from './utils/product-search-mapping';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private productVectorService: ProductVectorService,
    private behaviorService: BehaviorService, // 新增
  ) {}

  // 新增关键词搜索方法
  async search(keyword: string, query: QueryProductDto) {
    const {
      page = 1,
      pageSize = 10,
      communityId,
      sortBy,
      sortOrder,
      minPrice,
      maxPrice,
      condition,
      categoryId,
    } = query;

    try {
      // 使用映射工具扩展搜索条件
      const searchConditions = buildSearchConditions(keyword);

      // 构建基础查询条件
      const baseWhere: Prisma.ProductWhereInput = {
        OR: searchConditions,
        status: 'VERIFIED' as VerificationStatus,
        ...(query.communityId && { communityId: query.communityId }),
        // 其他筛选条件保持不变
        ...((query.minPrice || query.maxPrice) && {
          price: {
            ...(query.minPrice && { gte: query.minPrice }),
            ...(query.maxPrice && { lte: query.maxPrice }),
          },
        }),
        ...(query.condition && { condition: query.condition }),
        ...(query.categoryId && { categoryId: query.categoryId }),
      };

      // 构建排序条件
      let orderBy: Prisma.ProductOrderByWithRelationInput = {
        createTime: 'desc',
      };
      if (sortBy) {
        if (sortBy === 'publishTime') {
          orderBy = { createTime: sortOrder || 'desc' };
        } else if (sortBy === 'price') {
          orderBy = { price: sortOrder || 'asc' };
        } else if (sortBy === 'viewCount') {
          orderBy = { viewCount: sortOrder || 'desc' };
        }
      }

      // 语义向量搜索 - 使用 chromadb 向量搜索
      const semanticProductIds =
        await this.productVectorService.searchSimilarProducts(keyword, 20);
      console.log('语义搜索结果:', semanticProductIds);
      // 执行数据库查询
      const [basicTotal, basicItems] = await Promise.all([
        this.prisma.product.count({ where: baseWhere }),
        this.prisma.product.findMany({
          where: baseWhere,
          skip: (page - 1) * pageSize,
          take: Number(pageSize),
          orderBy,
        }),
      ]);

      // 获取语义匹配的结果
      let semanticItems = [];
      if (semanticProductIds.length > 0) {
        semanticItems = await this.prisma.product.findMany({
          where: {
            id: { in: semanticProductIds },
            status: 'VERIFIED',
            ...(communityId && { communityId }),
            // 对语义搜索结果也应用价格、成色和分类过滤
            ...((minPrice || maxPrice) && {
              price: {
                ...(minPrice && { gte: minPrice }),
                ...(maxPrice && { lte: maxPrice }),
              },
            }),
            ...(condition && { condition }),
            ...(categoryId && { categoryId }),
          },
        });
      }
      console.log('语义匹配结果:', semanticItems);
      // 合并搜索结果，去重
      let combinedItems = [...basicItems];
      const basicItemIds = new Set(basicItems.map((item) => item.id));
      console.log('基本搜索结果:', basicItems);
      for (const item of semanticItems) {
        if (!basicItemIds.has(item.id)) {
          combinedItems.push(item);
        }
      }

      // 如果提供了位置搜索参数，添加位置搜索逻辑
      if (query.maxDistance && query.centerLatitude && query.centerLongitude) {
        const earthRadius = 6371; // 地球半径，单位为km

        // 使用 Haversine 公式计算距离
        // 这里仅为示例，实际SQL实现会有所不同

        // 简化版：在应用层过滤结果
        const filteredResults = combinedItems.filter((product) => {
          if (product.latitude && product.longitude) {
            const distance = this.calculateDistance(
              query.centerLatitude,
              query.centerLongitude,
              product.latitude,
              product.longitude,
            );
            return distance <= query.maxDistance;
          }
          return false;
        });

        combinedItems = filteredResults;
      }

      // 记录搜索行为
      this.recordSearchBehavior(keyword, combinedItems).catch((error) => {
        console.error('记录搜索行为失败:', error);
      });

      // 如果有登录用户，记录搜索行为
      if (query.userId) {
        this.behaviorService
          .recordSearchBehavior(query.userId, keyword)
          .catch((error) => {
            console.error('记录搜索行为失败:', error);
          });
      }

      return ResultData.ok({
        items: combinedItems.slice(0, pageSize),
        total: Math.max(basicTotal, combinedItems.length),
        page,
        pageSize,
      });
    } catch (error) {
      console.error('搜索失败:', error);
      throw new HttpException('搜索失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 记录搜索行为
  private async recordSearchBehavior(keyword: string, products: any[]) {
    // TODO: 将来实现用户搜索行为记录
    return true;
  }

  // 修改 create 方法来添加向量索引
  async create(data: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        id: guid(),
        name: data.name,
        description: data.description,
        price: data.price,
        userId: data.userId,
        communityId: data.communityId,
        categoryId: data.categoryId,
        imageUrl: Array.isArray(data.imageUrl)
          ? JSON.stringify(data.imageUrl)
          : data.imageUrl,
        tags: data.tags,
        viewCount: 0,
        purchaseCount: 0,
        status: 'PENDING',
        // 添加位置信息
        latitude: data.latitude,
        longitude: data.longitude,
        locationDetail: data.locationDetail,
      },
    });
    console.log('创建物品:', product);
    // 生成并存储向量嵌入
    const content = `${product.name} ${product.description}`;
    await this.productVectorService.addOrUpdateProductEmbedding(
      product.id,
      content,
    );

    return ResultData.ok(product);
  }

  // 修改 update 方法来更新向量索引
  async update(id: string, data: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new HttpException('物品不存在', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        updateTime: new Date(),
      },
    });

    // 如果名称或描述更新了，更新向量嵌入
    if (data.name || data.description) {
      const content = `${updated.name} ${updated.description}`;
      await this.productVectorService.addOrUpdateProductEmbedding(id, content);
    }

    return ResultData.ok(updated);
  }

  // 修改 delete 方法来删除向量索引
  async delete(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new HttpException('物品不存在', HttpStatus.NOT_FOUND);
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        status: 'DELETED',
        updateTime: new Date(),
      },
    });

    // 从向量数据库中删除
    await this.productVectorService.deleteProductEmbedding(id);

    return ResultData.ok(null, '删除成功');
  }

  async findById(id: string, userId?: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new HttpException('物品不存在', HttpStatus.NOT_FOUND);
      }

      // 增加浏览次数
      await this.prisma.product.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      // 记录用户浏览行为
      if (userId) {
        this.behaviorService.recordViewBehavior(userId, id).catch((error) => {
          console.error('记录浏览行为失败:', error);
        });
      }

      // 为了保持与donation接口一致，将imageUrl重命名为images
      const result = {
        ...product,
        images: product.imageUrl,
      };

      return ResultData.ok(result);
    } catch (error) {
      console.error('查询物品失败:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException('查询物品失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(query: QueryProductDto) {
    const { page = 1, pageSize = 10, communityId, status, categoryId } = query;

    // 构建基本查询条件
    const where: Prisma.ProductWhereInput = {
      ...(status ? { status } : { status: { not: 'DELETED' } }),
      ...(communityId && { communityId }),
      ...(categoryId && { categoryId }),
    };

    const orderedProductIds = await this.prisma.order.findMany({
      select: {
        productId: true,
      },
      distinct: ['productId'],
    });

    where.id = {
      notIn: orderedProductIds.map((item) => item.productId),
    };

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: {
          createTime: 'desc',
        },
      }),
    ]);

    const mappedItems = items.map((item) => ({
      ...item,
      images: item.imageUrl,
    }));

    return ResultData.ok({
      items: mappedItems,
      total,
      page,
      pageSize,
    });
  }

  async findByUserId(userId: string, query: QueryProductDto) {
    const { page = 1, pageSize = 10, status } = query;

    const where: Prisma.ProductWhereInput = {
      userId,
      ...(status
        ? { status }
        : { status: { not: 'DELETED' as VerificationStatus } }),
    };

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        orderBy: {
          createTime: 'desc',
        },
      }),
    ]);

    // 为了保持前端接口一致，将所有结果的imageUrl重命名为images
    const mappedItems = items.map((item) => ({
      ...item,
      images: item.imageUrl,
    }));

    return ResultData.ok({
      items: mappedItems,
      total,
      page,
      pageSize,
    });
  }

  async verify(id: string, status: VerificationStatus) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new HttpException('物品不存在', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        status,
        updateTime: new Date(),
      },
    });

    return ResultData.ok(updated);
  }

  // 添加辅助方法计算两点之间距离
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const earthRadius = 6371; // 地球半径，单位为km
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  private degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
