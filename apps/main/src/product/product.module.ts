// 更新 ProductModule 导出 ProductVectorService
import { Module, forwardRef } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductVectorService } from './product-vector.service';
import { EmbeddingModule } from '../embedding/embedding.module';
import { BehaviorModule } from '../behavior/behavior.module';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { ChromaModule } from '@app/chroma';

@Module({
  imports: [
    EmbeddingModule,
    BehaviorModule,
    ChromaModule,
    forwardRef(() => RecommendationModule), // 解决循环依赖
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductVectorService],
  exports: [ProductService, ProductVectorService], // 确保导出 ProductVectorService
})
export class ProductModule {}
