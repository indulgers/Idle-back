import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/message.dto';
import { ChatEvents } from './chat.events';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat', // 修改命名空间
  transports: ['websocket', 'polling'], // 允许多种传输方式
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private readonly chatService: ChatService,
    private readonly events: ChatEvents,
  ) {}

  afterInit() {
    // 订阅事件
    this.events.subscribe((event) => {
      if (event.type === 'message' && event.roomId) {
        this.server.to(event.roomId).emit('newMessage', event.data);
      }
      if (event.type === 'notification' && event.userId) {
        this.server.to(event.userId).emit('notification', event.data);
      }
    });
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(userId); // 用户加入自己的房间
      console.log(`User ${userId} connected`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.userSockets.entries()).find(
      ([_, socketId]) => socketId === client.id,
    )?.[0];
    if (userId) {
      this.userSockets.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, roomId: string) {
    client.join(roomId);
    console.log(`Client ${client.id} joined room ${roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, roomId: string) {
    client.leave(roomId);
    console.log(`Client ${client.id} left room ${roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: SendMessageDto) {
    try {
      const message = await this.chatService.sendMessage(payload);
      // 广播消息给房间内的所有用户
      this.server.to(payload.chatId).emit('newMessage', message);
      return message;
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // 通知用户有新消息
  notifyUser(userId: string, message: any) {
    this.server.to(userId).emit('notification', message);
  }
}
