import { Injectable } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';

@Injectable()
export class ChromaService {
  private client: ChromaClient;

  constructor() {
    // 初始化时使用环境变量配置（默认为 localhost:8000）
    this.client = new ChromaClient({
      path: process.env.CHROMA_DB_URL || 'http://localhost:8000',
    });
  }

  /**
   * 自动获取或创建集合
   */
  async getOrCreateCollection(options: {
    name: string;
    embeddingFunction: {
      generate: (texts: string[]) => Promise<number[][]>;
    };
  }): Promise<Collection> {
    return this.client.getOrCreateCollection(options);
  }

  /**
   * 添加文档到集合
   */
  async addDocuments(options: {
    collection: Collection;
    documents: string[];
    metadatas?: Record<string, any>[];
    ids?: string[];
  }) {
    const { collection, documents, metadatas, ids } = options;
    return collection.add({
      documents,
      metadatas,
      ids: ids || documents.map((_, i) => `doc_${i}`),
    });
  }

  /**
   * 语义搜索
   */
  async semanticSearch(options: {
    collection: Collection;
    query: string;
    embeddingFunction: {
      generate: (texts: string[]) => Promise<number[][]>;
    };
    nResults?: number;
    where?: Record<string, any>;
    whereDocument?: Record<string, any>;
    minSimilarity?: number;
  }) {
    const {
      collection,
      query,
      embeddingFunction,
      nResults = 5,
      where,
      whereDocument,
      minSimilarity = 0.7,
    } = options;

    const queryEmbedding = await embeddingFunction.generate([query]);
    const results = await collection.query({
      queryEmbeddings: queryEmbedding,
      nResults,
      where,
      whereDocument,
    });

    // 过滤相似度低于阈值的结果
    const filteredResults = results.distances[0].map((distance, index) => {
      return {
        document: results.documents[0][index],
        metadata: results.metadatas[0][index],
        similarity: 1 - distance, // 将距离转换为相似度
      };
    })
      .filter((result) => result.similarity >= minSimilarity);

    return filteredResults;
  }

  async deleteCollection(name: string) {
    return this.client.deleteCollection({ name });
  }

  /**
   * 若需要直接获取 ChromaClient 可使用该方法
   */
  getClient(): ChromaClient {
    return this.client;
  }
}
