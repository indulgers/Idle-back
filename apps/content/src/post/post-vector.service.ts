import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChromaService } from '@app/chroma';
import { EmbeddingService } from '../../../main/src/embedding/embedding.service';
import { Collection } from 'chromadb';

@Injectable()
export class PostVectorService implements OnModuleInit {
  private collection: Collection;
  private readonly collectionName = 'post_embeddings';

  constructor(
    private readonly chromaService: ChromaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async onModuleInit() {
    try {
      // 获取或创建帖子向量集合
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

      console.log('帖子向量集合初始化成功');
    } catch (error) {
      console.error('初始化帖子向量集合失败:', error);
    }
  }

  /**
   * 添加或更新帖子向量
   */
  async addOrUpdatePostEmbedding(postId: string, content: string) {
    try {
      // 检查是否已存在该ID的嵌入
      const exists = await this.collection.get({
        ids: [postId],
        include: [],
      });

      if (exists && exists.ids.length > 0) {
        // 如果存在，先删除
        await this.collection.delete({
          ids: [postId],
        });
      }

      // 添加新嵌入
      await this.collection.add({
        ids: [postId],
        documents: [content],
      });

      return true;
    } catch (error) {
      console.error(`帖子向量处理失败 [${postId}]:`, error);
      return false;
    }
  }

  /**
   * 删除帖子向量
   */
  async deletePostEmbedding(postId: string) {
    try {
      await this.collection.delete({
        ids: [postId],
      });
      return true;
    } catch (error) {
      console.error(`删除帖子向量失败 [${postId}]:`, error);
      return false;
    }
  }

  /**
   * 查询相似帖子
   */
  async searchSimilarPosts(query: string, limit: number = 10) {
    try {
      // 查询相似帖子
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: limit,
      });

      // 返回匹配的帖子ID
      return results.ids[0] || [];
    } catch (error) {
      console.error('向量相似度搜索失败:', error);
      return [];
    }
  }

  /**
   * 批量索引帖子
   */
  async batchIndexPosts(posts: Array<{ id: string; content: string }>) {
    try {
      // 批量添加向量
      await this.collection.add({
        ids: posts.map((p) => p.id),
        documents: posts.map((p) => p.content),
      });
      return true;
    } catch (error) {
      console.error('批量索引帖子失败:', error);
      return false;
    }
  }
}
