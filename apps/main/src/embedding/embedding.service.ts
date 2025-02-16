import { Injectable } from '@nestjs/common';
import { OllamaEmbedding } from '@llamaindex/ollama';
@Injectable()
export class EmbeddingService {
  private embedder = new OllamaEmbedding({
    model: 'nomic-embed-text',
  });

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // 调用 embeddings 方法，而非 complete
      const embedding = await this.embedder.getTextEmbedding(text);

      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async batchEmbed(texts: string[]): Promise<number[][]> {
    const embeddings = await this.embedder.getTextEmbeddingsBatch(texts);

    return embeddings;
  }
}
