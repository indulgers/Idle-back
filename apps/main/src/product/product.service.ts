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
      // 构建基础查询条件
      const baseWhere: Prisma.ProductWhereInput = {
        OR: [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
        ],
        status: 'VERIFIED' as VerificationStatus, // 使用类型断言或直接使用枚举值
        ...(communityId && { communityId }),

        // 价格筛选
        ...((minPrice || maxPrice) && {
          price: {
            ...(minPrice && { gte: minPrice }),
            ...(maxPrice && { lte: maxPrice }),
          },
        }),

        // 商品成色筛选 - 假设有一个 condition 字段，可能需要根据实际数据库结构调整
        ...(condition && { condition }),

        // 分类筛选 - 假设有一个 categoryId 字段，可能需要根据实际数据库结构调整
        ...(categoryId && { categoryId }),
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

      // 合并搜索结果，去重
      const combinedItems = [...basicItems];
      const basicItemIds = new Set(basicItems.map((item) => item.id));

      for (const item of semanticItems) {
        if (!basicItemIds.has(item.id)) {
          combinedItems.push(item);
        }
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
        imageUrl: data.imageUrl,
        tags: data.tags,
        viewCount: 0,
        purchaseCount: 0,
        status: 'PENDING',
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
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createTime: 'desc' },
          take: 10, // 默认获取最新的10条评论
        },
      },
    });

    if (!product) {
      throw new HttpException('物品不存在', HttpStatus.NOT_FOUND);
    }

    // 增加浏览次数
    await this.prisma.product.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });

    // 如果有登录用户，记录浏览行为
    if (userId) {
      this.behaviorService.recordViewBehavior(userId, id).catch((error) => {
        console.error('记录浏览行为失败:', error);
      });
    }

    return ResultData.ok(product);
  }

  async findAll(query: QueryProductDto) {
    const { page = 1, pageSize = 10, communityId, status } = query;

    const where: Prisma.ProductWhereInput = {
      ...(status ? { status } : { status: { not: 'DELETED' } }), // 使用正确的枚举值
      ...(communityId && { communityId }),
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

    return ResultData.ok({
      items,
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

    return ResultData.ok({
      items,
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
}
