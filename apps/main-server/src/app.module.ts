import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketModule } from './socket/socket.module';
import { ReviewModule } from './review/review.module';
import { PointModule } from './point/point.module';
import { LogisticsModule } from './logistics/logistics.module';
@Module({
  imports: [SocketModule, ReviewModule, PointModule, LogisticsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
