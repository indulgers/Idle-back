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
    // 获取基本聊天室列表
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

    // 增强聊天室数据，添加用户信息和产品信息
    const enhancedRooms = await Promise.all(
      rooms.map(async (room) => {
        // 确定是买家还是卖家视角，获取对方ID
        const isUserBuyer = room.buyerId === userId;
        const otherUserId = isUserBuyer ? room.sellerId : room.buyerId;

        // 获取对方用户信息
        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        });

        // 查找该聊天室中的产品类型消息
        const productMessage = await this.prisma.message.findFirst({
          where: {
            chatId: room.id,
            type: 'PRODUCT',
          },
          orderBy: { createTime: 'desc' },
        });

        let productInfo = null;
        if (productMessage) {
          // 提取产品ID (假设产品消息的content字段是JSON格式，包含productId)
          try {
            const productData = JSON.parse(productMessage.content);
            if (productData.productId) {
              // 获取产品信息
              const product = await this.prisma.product.findUnique({
                where: { id: productData.productId },
              });
              if (product) {
                productInfo = {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  images: JSON.parse(product.imageUrl || '[]'),
                };
              }
            }
          } catch (e) {
            console.error('解析产品消息失败:', e);
          }
        }

        // 标记未读消息数
        const unreadCount = await this.prisma.message.count({
          where: {
            chatId: room.id,
            senderId: { not: userId },
            read: false,
          },
        });

        // 返回增强的聊天室数据
        return {
          ...room,
          otherUser,
          productInfo,
          unreadCount,
          lastMessage: room.messages[0] || null,
        };
      }),
    );

    return ResultData.ok(enhancedRooms);
  }

  // 获取聊天记录
  async getMessages(roomId: string) {
    const room = await this.prisma.chat.findUnique({
      where: { id: roomId },
    });
    console.log('room', room);
    if (!room) {
      throw new HttpException('聊天室不存在', HttpStatus.NOT_FOUND);
    }
    console.log('room', room);
    const messages = await this.prisma.message.findMany({
      where: { chatId: roomId },
      orderBy: { createTime: 'asc' },
    });
    console.log(
      'messages',
      await this.prisma.message.findMany({
        where: { chatId: 'cm8srd6tf00016tfo7cvp1c0v' },
        orderBy: { createTime: 'asc' },
      }),
    );

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
