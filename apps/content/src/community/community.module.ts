import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
@Module({
  // imports: [
  //   ClientsModule.register([
  //     {
  //       name: 'COMMUNITY_SERVICE',
  //       transport: Transport.TCP,
  //       options: {
  //         host: '127.0.0.1', // 使用IPv4地址替代localhost避免IPv6解析
  //         port: 3002,
  //       },
  //     },
  //   ]),
  // ],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
