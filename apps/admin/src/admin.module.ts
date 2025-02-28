import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule, PrismaService } from '@app/prisma';
import { JwtModule } from '@nestjs/jwt';
import * as winston from 'winston';
import { utilities, WinstonModule } from 'nest-winston';
import { FakeAuthMiddleware } from '../../common/middleware/auth.middleware';
import { CommunityModule } from './community/community.module';
import { jwtConstants } from '@app/common/enums/constant';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { ProductModule } from './product/product.module';
import { DonateModule } from './donation/donate.module';
@Module({
  imports: [
    PrismaModule,
    CommunityModule,
    UserModule,
    ProductModule,
    DonateModule,
    OrderModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60d' },
    }),
    WinstonModule.forRootAsync({
      useFactory: () => ({
        level: 'debug',
        transports: [
          new winston.transports.File({
            filename: `${process.cwd()}/log.js`,
          }),
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              utilities.format.nestLike(),
            ),
          }),
        ],
      }),
    }),

    OrderModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    Reflector,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AdminModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(FakeAuthMiddleware).forRoutes('*');
  // }
}
