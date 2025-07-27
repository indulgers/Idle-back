import { Module } from '@nestjs/common';
import { DonationController } from './donation.controller';
import { DonationService } from './donation.service';
import { PrismaModule } from '@app/prisma';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'CONTENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1', // 使用明确的IPv4地址而不是localhost
          port: parseInt(process.env.CONTENT_SERVICE_PORT || '3004'),
        },
      },
    ]),
  ],
  controllers: [DonationController],
  providers: [DonationService],
  exports: [DonationService],
})
export class DonationModule {}
