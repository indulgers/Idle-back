import { Module } from '@nestjs/common';
import { MainController } from './main.controller';
import { MainService } from './main.service';
import { EmbeddingModule } from './embedding/embedding.module';
import { RecommendModule } from './recommend/recommend.module';
import { PrismaModule, PrismaService } from '@app/prisma';
import { ChromaModule, ChromaService } from '@app/chroma';
@Module({
  imports: [EmbeddingModule, RecommendModule, PrismaModule, ChromaModule],
  controllers: [MainController],
  providers: [MainService, PrismaService, ChromaService],
})
export class MainModule {}
