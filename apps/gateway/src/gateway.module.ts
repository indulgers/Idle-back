import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '@app/common/enums/constant';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
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
          host: process.env.MAIN_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.MAIN_SERVICE_PORT || '3001'),
        },
      },
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
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
