import { Injectable } from '@nestjs/common';
import { ChromaClient } from 'chromadb';

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
  }) {
    return this.client.getOrCreateCollection(options);
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
