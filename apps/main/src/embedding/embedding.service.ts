import { Injectable } from '@nestjs/common';
import { OllamaEmbeddingFunction } from 'chromadb';

@Injectable()
export class EmbeddingService {
  private embedder = new OllamaEmbeddingFunction({
    url: 'http://127.0.0.1:11434',
    model: 'phi3:mini',
  });

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log(`生成嵌入向量: "${text}"`);
      const embedding = await this.embedder.generate([text]);
      console.log(`成功生成嵌入向量，维度: ${embedding[0].length}`);
      return embedding[0];
    } catch (error) {
      console.error('生成嵌入向量失败:', error);
      
      if (error.message.includes('404')) {
        console.error('Ollama服务无法访问或模型不存在，请检查:');
        console.error('1. Ollama服务是否运行在 http://127.0.0.1:11434');
        console.error('2. 模型 "phi3:mini" 是否已经安装');
        console.error('3. 尝试使用 curl http://127.0.0.1:11434/api/embeddings 测试API');
      }
      
      throw error;
    }
  }

  async batchEmbed(texts: string[]): Promise<number[][]> {
    try {
      console.log(`批量生成嵌入向量, 数量: ${texts.length}`);
      const embeddings = await this.embedder.generate(texts);
      return embeddings;
    } catch (error) {
      console.error('批量生成嵌入向量失败:', error);
      throw error;
    }
  }
}
