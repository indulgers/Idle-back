import { Module } from '@nestjs/common';
import { MainController } from './main.controller';
import { MainService } from './main.service';
import { EmbeddingModule } from './embedding/embedding.module';
import { RecommendModule } from './recommend/recommend.module';
import { MinioModule } from '@app/minio';
import { PrismaModule, PrismaService } from '@app/prisma';
import { ChromaModule, ChromaService } from '@app/chroma';
import { CacheModule } from '@app/cache';
import { MinioController } from '@app/minio/minio.controller';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '@app/common/enums/constant';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    EmbeddingModule,
    RecommendModule,
    PrismaModule,
    ChromaModule,
    MinioModule,
    UserModule,
    CacheModule,
    ChatModule,
    JwtModule.register({
      signOptions: { expiresIn: '30d' },
      global: true,
      secret: jwtConstants.secret,
    }),
  ],
  controllers: [MainController, MinioController],
  providers: [MainService, PrismaService, ChromaService],
})
export class MainModule {}
