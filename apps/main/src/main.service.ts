import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MainService {
  constructor(
    @Inject('CONTENT_SERVICE') private readonly contentClient: ClientProxy,
  ) {}

  getHello(): string {
    return 'Hello from Main Service!';
  }

  async forwardToContentService(
    module: string,
    method: string,
    data: any,
  ): Promise<any> {
    try {
      // 使用微服务通信
      const pattern = { module, method };
      const result = await firstValueFrom(
        this.contentClient.send(pattern, data),
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        module,
        method,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
