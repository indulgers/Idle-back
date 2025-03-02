import { Module } from '@nestjs/common';
import { MainController } from './main.controller';
import { MainService } from './main.service';
import { EmbeddingModule } from './embedding/embedding.module';
import { MinioModule } from '@app/minio';
import { PrismaModule, PrismaService } from '@app/prisma';
import { ChromaModule, ChromaService } from '@app/chroma';
import { CacheModule } from '@app/cache';
import { MinioController } from '@app/minio/minio.controller';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '@app/common/enums/constant';
import { ChatModule } from './chat/chat.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { BehaviorModule } from './behavior/behavior.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { DonationModule } from './donate/donation.module';
@Module({
  imports: [
    EmbeddingModule,
    PrismaModule,
    PostModule,
    ChromaModule,
    MinioModule,
    CommentModule,
    ProductModule,
    UserModule,
    CacheModule,
    ChatModule,
    BehaviorModule,
    DonationModule,
    RecommendationModule,
    JwtModule.register({
      signOptions: { expiresIn: '30d' },
      global: true,
      secret: jwtConstants.secret,
    }),
    PostModule,
    CommentModule,
    ProductModule,
    OrderModule,
  ],
  controllers: [MainController, MinioController],
  providers: [MainService, PrismaService, ChromaService],
})
export class MainModule {}
