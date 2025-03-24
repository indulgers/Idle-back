import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { PrismaModule, PrismaService } from '@app/prisma';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '@app/common/enums/constant';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@app/cache';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { CommunityModule } from './community/community.module';
import { PointModule } from './point/point.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    CacheModule,
    HttpModule,
    JwtModule.register({
      signOptions: { expiresIn: '30d' },
      global: true,
      secret: jwtConstants.secret,
    }),
    // 从main服务迁移的模块
    PostModule,
    CommentModule,
    CommunityModule,
    PointModule,
  ],
  controllers: [ContentController],
  providers: [ContentService, PrismaService],
})
export class ContentModule {}
