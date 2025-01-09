import { Module } from '@nestjs/common';
import { DonateController } from './donate.controller';
import { DonateService } from './donate.service';
import { PrismaModule } from '@app/prisma';
@Module({
  imports: [PrismaModule],
  controllers: [DonateController],
  providers: [DonateService],
})
export class DonateModule {}
