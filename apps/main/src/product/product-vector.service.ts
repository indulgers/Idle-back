import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChromaService } from '@app/chroma';
import { EmbeddingService } from '../embedding/embedding.service';
import { Collection } from 'chromadb';
import { PrismaService } from '@app/prisma';

@Injectable()
export class ProductVectorService implements OnModuleInit {
  private collection: Collection;
  private readonly collectionName = 'product_embeddings';
  private lastQuerySimilarities: Record<string, number> = {};

  constructor(
    private readonly chromaService: ChromaService,
    private readonly embeddingService: EmbeddingService,
    private readonly prisma: PrismaService, // 添加 PrismaService
  ) {}

  async onModuleInit() {
    try {
      // 获取或创建产品向量集合
      this.collection = await this.chromaService.getOrCreateCollection({
        name: this.collectionName,
        embeddingFunction: {
          generate: async (texts: string[]) => {
            // 使用现有的嵌入服务生成向量
            const embeddings = await Promise.all(
              texts.map((text) =>
                this.embeddingService.generateEmbedding(text),
              ),
            );
            return embeddings;
          },
        },
      });

      console.log('产品向量集合初始化成功');

      // 初始化加载现有产品
      // await this.initializeProductVectors();
    } catch (error) {
      console.error('初始化产品向量集合失败:', error);
    }
  }

  /**
   * 初始化所有现有产品到向量数据库
   */
  // private async initializeProductVectors() {
  //   try {
  //     console.log('开始初始化产品向量...');
  //     const results = await this.collection.get();
  //     console.log(results);
  //     // 获取向量库中已有的产品ID
  //     console.log(
  //       await this.collection.query({
  //         queryTexts: ['键盘'],
  //       }),
  //     );
  //     const existingIds = await this.getExistingProductIds();
  //     console.log(`向量库中已有 ${existingIds.size} 个产品索引`);

  //     // 获取所有已验证的产品，但不在向量库中的产品
  //     const products = await this.prisma.product.findMany({
  //       where: {
  //         status: 'VERIFIED',
  //         id: { notIn: Array.from(existingIds) },
  //       },
  //       select: {
  //         id: true,
  //         name: true,
  //         description: true,
  //       },
  //     });

  //     if (products.length === 0) {
  //       console.log('没有需要初始化的新产品');
  //       return;
  //     }

  //     console.log(`找到 ${products.length} 个未索引的产品，开始批量索引...`);

  //     // 准备批量索引数据
  //     const batchData = products.map((product) => ({
  //       id: product.id,
  //       content: `${product.name} ${product.description}`,
  //     }));

  //     // 批量处理，每批 100 个
  //     const batchSize = 100;
  //     for (let i = 0; i < batchData.length; i += batchSize) {
  //       const batch = batchData.slice(i, i + batchSize);
  //       await this.batchIndexProducts(batch);
  //       console.log(
  //         `已处理 ${Math.min(i + batchSize, batchData.length)}/${batchData.length} 个产品`,
  //       );
  //     }

  //     console.log('产品向量初始化完成');
  //   } catch (error) {
  //     console.error('初始化产品向量失败:', error);
  //   }
  // }

  /**
   * 获取向量库中已存在的产品ID
   */
  // private async getExistingProductIds(): Promise<Set<string>> {
  //   try {
  //     const result = await this.collection.get();
  //     return new Set(result.ids || []);
  //   } catch (error) {
  //     console.error('获取现有产品ID失败:', error);
  //     return new Set();
  //   }
  // }

  /**
   * 添加或更新产品向量
   */
  async addOrUpdateProductEmbedding(productId: string, content: string) {
    try {
      // 检查是否已存在该ID的嵌入
      const existingCount = await this.collection.count();

      if (existingCount > 0) {
        // 如果存在，先删除
        await this.collection.delete({
          ids: [productId],
        });
      }

      // 添加新嵌入
      await this.collection.add({
        ids: [productId],
        documents: [content],
      });

      return true;
    } catch (error) {
      console.error(`产品向量处理失败 [${productId}]:`, error);
      return false;
    }
  }

  /**
   * 删除产品向量
   */
  async deleteProductEmbedding(productId: string) {
    try {
      await this.collection.delete({
        ids: [productId],
      });
      return true;
    } catch (error) {
      console.error(`删除产品向量失败 [${productId}]:`, error);
      return false;
    }
  }

  /**
   * 查询相似产品
   */
  async searchSimilarProducts(
    query: string,
    limit: number = 5,
    minSimilarity: number = 0.55, // 添加最低相似度阈值
  ) {
    try {
      // 查询相似产品
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: limit,
      });

      // 过滤并记录相似度信息
      const ids = results.ids[0] || [];
      const distances = results.distances?.[0] || [];

      // 存储ID和相似度的映射
      const productSimilarities: Record<string, number> = {};
      const filteredIds: string[] = [];

      if (ids.length > 0 && distances.length > 0) {
        // 记录每个结果的相似度 (距离转换为相似度)
        const similarityInfo = ids.map((id, index) => {
          // 将距离转换为相似度，距离越小相似度越高
          const similarity = 1 - distances[index];
          productSimilarities[id] = similarity;
          return { id, similarity: similarity.toFixed(4) };
        });

        console.log('语义搜索相似度详情:', similarityInfo);
        console.log('语义搜索结果: ', distances);
        // 只保留相似度超过阈值的结果
        for (let i = 0; i < ids.length; i++) {
          if (1 - distances[i] >= minSimilarity) {
            filteredIds.push(ids[i]);
          }
        }

        console.log(`语义搜索过滤后结果: ${filteredIds.length}/${ids.length}`);
      }

      // 额外存储相似度信息，以便后续使用
      this.lastQuerySimilarities = productSimilarities;

      return filteredIds;
    } catch (error) {
      console.error('向量相似度搜索失败:', error);
      return [];
    }
  }

  // 添加方法获取产品相似度
  getProductSimilarity(productId: string): number {
    return this.lastQuerySimilarities[productId] || 0;
  }

  /**
   * 批量索引产品
   */
  async batchIndexProducts(products: Array<{ id: string; content: string }>) {
    try {
      // 批量添加向量
      await this.collection.add({
        ids: products.map((p) => p.id),
        documents: products.map((p) => p.content),
      });
      return true;
    } catch (error) {
      console.error('批量索引产品失败:', error);
      return false;
    }
  }
}
