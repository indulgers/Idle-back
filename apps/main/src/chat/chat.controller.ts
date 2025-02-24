import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/chat.dto';
import { SendMessageDto } from './dto/message.dto';
@Controller('chat')
@ApiTags('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('room')
  @ApiOperation({ summary: '创建聊天室' })
  async createRoom(@Body() data: CreateChatDto) {
    return this.chatService.createRoom(data);
  }

  @Post('message')
  @ApiOperation({ summary: '发送消息' })
  async sendMessage(@Body() data: SendMessageDto) {
    return this.chatService.sendMessage(data);
  }

  @Get('rooms/:userId')
  @ApiOperation({ summary: '获取聊天室列表' })
  async getRooms(@Param('userId') userId: string) {
    return this.chatService.getRooms(userId);
  }

  @Get('messages')
  @ApiOperation({ summary: '获取聊天记录' })
  async getMessages(@Query('chatId') roomId: string) {
    console.log('roomId', roomId);
    return this.chatService.getMessages(roomId);
  }
}
