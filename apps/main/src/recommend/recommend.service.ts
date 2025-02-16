import { Inject, Injectable } from '@nestjs/common';
import { ChromaService } from '@app/chroma';
import { PrismaService } from '@app/prisma';
import { EmbeddingService } from '../embedding/embedding.service';
import { ResultData } from '@app/common';

@Injectable()
export class RecommendationsService {
  private collection: any;

  constructor(
    @Inject(ChromaService)
    private readonly chromaService: ChromaService,
    @Inject(PrismaService)
    private prisma: PrismaService,
    @Inject(EmbeddingService)
    private embeddingService: EmbeddingService,
  ) {
    this.initializeCollection();
  }

  private async initializeCollection() {
    this.collection = await this.chromaService.getOrCreateCollection({
      name: 'products',
      embeddingFunction: {
        generate: async (texts: string[]) =>
          this.embeddingService.batchEmbed(texts),
      },
    });
  }

  async indexProduct(product: any) {
    const embedding = await this.embeddingService.generateEmbedding(
      `${product.name}: ${product.description}`,
    );

    await this.collection.add({
      ids: [product.id.toString()],
      embeddings: [embedding],
      metadatas: [
        {
          category: product.category,
          price: product.price,
        },
      ],
    });
  }

  async recommendSimilar(query: string, filters = {}) {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 10,
      where: filters,
    });
    console.log('res', results);
    console.log('results:', results.ids[0]);
    const productIds = results.ids[0];
    console.log(
      'productIds:',
      await this.prisma.product.findFirst({
        where: {
          id: productIds[0], // 使用正确的查询条件格式
        },
      }),
    );
    return ResultData.ok(
      await this.prisma.product.findFirst({
        where: {
          id: productIds[0], // 使用正确的查询条件格式
        },
      }),
    );
  }
  async deleteProduct(productIds: string[], filters = {}) {
    await this.collection.delete({
      ids: productIds,
      where: filters,
    });
  }
}
