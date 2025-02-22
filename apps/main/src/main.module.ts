import { Module } from '@nestjs/common';
import { MainController } from './main.controller';
import { MainService } from './main.service';
import { EmbeddingModule } from './embedding/embedding.module';
import { RecommendModule } from './recommend/recommend.module';
import { MinioModule } from '@app/minio';
import { PrismaModule, PrismaService } from '@app/prisma';
import { ChromaModule, ChromaService } from '@app/chroma';
import { MinioController } from '@app/minio/minio.controller';
@Module({
  imports: [
    EmbeddingModule,
    RecommendModule,
    PrismaModule,
    ChromaModule,
    MinioModule,
  ],
  controllers: [MainController, MinioController],
  providers: [MainService, PrismaService, ChromaService],
})
export class MainModule {}
