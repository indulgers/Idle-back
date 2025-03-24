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
import { HttpModule } from '@nestjs/axios'; // 确保先安装 @nestjs/axios
import { ConfigModule } from '@nestjs/config';
import { jwtConstants } from '@app/common/enums/constant';
import { ChatModule } from './chat/chat.module';
// 已迁移到content服务的模块
// import { PostModule } from './post/post.module';
// import { CommentModule } from './comment/comment.module';
// import { CommunityModule } from './community/community.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { BehaviorModule } from './behavior/behavior.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { DonationModule } from './donate/donation.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    EmbeddingModule,
    PrismaModule,
    // 已迁移到content服务的模块
    // PostModule,
    ChromaModule,
    MinioModule,
    // CommentModule,
    ProductModule,
    UserModule,
    CacheModule,
    ChatModule,
    BehaviorModule,
    DonationModule,
    RecommendationModule,
    // CommunityModule,
    JwtModule.register({
      signOptions: { expiresIn: '30d' },
      global: true,
      secret: jwtConstants.secret,
    }),
    ClientsModule.register([
      {
        name: 'MAIN_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1', // 显式指定 IPv4
          port: 3001, // 与 PM2 配置一致
        },
      },
    ]),
    // PostModule,
    // CommentModule,
    ProductModule,
    OrderModule,
    // 添加与content服务的通信
    ClientsModule.register([
      {
        name: 'CONTENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.CONTENT_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.CONTENT_SERVICE_PORT || '3004'),
        },
      },
    ]),
  ],
  controllers: [MainController, MinioController],
  providers: [MainService, PrismaService, ChromaService],
})
export class MainModule {}
