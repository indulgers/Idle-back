import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ResultData } from '@app/common';
import { CreateChatDto } from './dto/chat.dto';
import { SendMessageDto } from './dto/message.dto';
import { ChatEvents } from './chat.events';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private readonly events: ChatEvents,
  ) {}

  // 创建聊天室
  async createRoom({ sellerId, buyerId }: CreateChatDto) {
    // 检查是否已存在聊天室
    const existingRoom = await this.prisma.chat.findFirst({
      where: {
        sellerId,
      },
    });

    if (existingRoom) {
      return ResultData.ok(existingRoom);
    }

    const room = await this.prisma.chat.create({
      data: {
        sellerId,
        buyerId,
      },
    });

    return ResultData.ok(room);
  }

  // 检查聊天室是否存在
  async checkRoom(sellerId: string, buyerId: string, productId?: string) {
    const room = await this.prisma.chat.findFirst({
      where: {
        sellerId,
        buyerId,
      },
    });

    return ResultData.ok({
      exists: !!room,
      chatId: room?.id,
    });
  }

  // 发送消息
  async sendMessage(data: SendMessageDto) {
    const room = await this.prisma.chat.findUnique({
      where: { id: data.chatId },
      include: {
        messages: true,
      },
    });

    if (!room) {
      throw new HttpException('聊天室不存在', HttpStatus.NOT_FOUND);
    }
    console.log('room', room);
    if (room.buyerId !== data.senderId && room.sellerId !== data.senderId) {
      throw new HttpException('无权访问该聊天室', HttpStatus.FORBIDDEN);
    }

    const message = await this.prisma.message.create({
      data: {
        chatId: data.chatId,
        senderId: data.senderId,
        content: data.content,
        type: data.type,
      },
    });

    // 发送事件而不是直接调用 gateway
    this.events.emit({
      type: 'message',
      roomId: data.chatId,
      data: message,
    });

    return ResultData.ok(message);
  }

  // 获取聊天室列表
  async getRooms(userId: string) {
    const rooms = await this.prisma.chat.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        messages: {
          orderBy: { createTime: 'desc' },
          take: 1,
        },
      },
      orderBy: { updateTime: 'desc' },
    });

    return ResultData.ok(rooms);
  }

  // 获取聊天记录
  async getMessages(roomId: string) {
    const room = await this.prisma.chat.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new HttpException('聊天室不存在', HttpStatus.NOT_FOUND);
    }

    const messages = await this.prisma.message.findMany({
      where: { chatId: roomId },
      orderBy: { createTime: 'asc' },
    });
    console.log('messages', messages);
    // 标记消息为已读
    await this.prisma.message.updateMany({
      where: {
        chatId: roomId,
        read: false,
      },
      data: { read: true },
    });

    return ResultData.ok(messages);
  }
}
