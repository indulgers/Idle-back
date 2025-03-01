import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChromaService } from '@app/chroma';
import { EmbeddingService } from '../embedding/embedding.service';
import { Collection } from 'chromadb';

@Injectable()
export class ProductVectorService implements OnModuleInit {
  private collection: Collection;
  private readonly collectionName = 'product_embeddings';

  constructor(
    private readonly chromaService: ChromaService,
    private readonly embeddingService: EmbeddingService,
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
    } catch (error) {
      console.error('初始化产品向量集合失败:', error);
    }
  }

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
  async searchSimilarProducts(query: string, limit: number = 10) {
    try {
      // 查询相似产品
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: limit,
      });

      // 返回匹配的产品ID
      return results.ids[0] || [];
    } catch (error) {
      console.error('向量相似度搜索失败:', error);
      return [];
    }
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
