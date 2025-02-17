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

    // 将 ID 和距离组合成对象数组，便于排序
    const productsWithDistances = results.ids[0].map(
      (id: string, index: number) => ({
        id,
        distance: results.distances[0][index],
      }),
    );

    // 按距离升序排序（距离越小越相似）
    productsWithDistances.sort((a, b) => a.distance - b.distance);

    // 获取排序后的 ID 数组
    const sortedProductIds = productsWithDistances.map((p) => p.id);
    // 使用 Prisma 查询，并保持排序顺序
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: sortedProductIds,
        },
      },
    });

    // 根据 sortedProductIds 的顺序重新排序查询结果
    const sortedProducts = sortedProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);
    return ResultData.ok(sortedProducts);
  }
  async deleteProduct(productIds: string[], filters = {}) {
    await this.collection.delete({
      ids: productIds,
      where: filters,
    });
  }
}
