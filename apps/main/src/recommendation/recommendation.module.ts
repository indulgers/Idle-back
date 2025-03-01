// 整合后的 recommendation.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { ProductModule } from '../product/product.module';
import { BehaviorModule } from '../behavior/behavior.module';
import { PrismaModule } from '@app/prisma';
import { CacheModule } from '@app/cache';
import { EmbeddingModule } from '../embedding/embedding.module';
import { ChromaModule } from '@app/chroma';

@Module({
  imports: [
    forwardRef(() => ProductModule), // 解决循环依赖
    BehaviorModule,
    PrismaModule,
    CacheModule,
    EmbeddingModule,
    ChromaModule,
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
