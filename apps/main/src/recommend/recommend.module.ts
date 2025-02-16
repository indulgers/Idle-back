import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommend.service';
import { RecommendController } from './recommend.controller';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [EmbeddingModule],
  controllers: [RecommendController],
  providers: [RecommendationsService],
})
export class RecommendModule {}
