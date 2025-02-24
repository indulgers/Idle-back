import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatEvents } from './chat.events';

@Module({
  controllers: [ChatController],
  providers: [ChatEvents, ChatService, ChatGateway],
})
export class ChatModule {}
