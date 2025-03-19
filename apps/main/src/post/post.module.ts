import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PostVectorService } from './post-vector.service';
import { ChromaModule } from '@app/chroma';
import { EmbeddingModule } from '../embedding/embedding.module';
@Module({
  imports: [
    // 导入PrismaModule以提供PrismaService

    // 导入ChromaModule以提供ChromaService
    ChromaModule,
    // 导入EmbeddingModule以提供EmbeddingService
    EmbeddingModule,
  ],
  controllers: [PostController],
  providers: [PostService, PostVectorService],
})
export class PostModule {}
