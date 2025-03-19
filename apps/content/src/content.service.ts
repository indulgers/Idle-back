import { Injectable } from '@nestjs/common';

@Injectable()
export class ContentService {
  getHello(): string {
    return 'Hello from Content Service!';
  }

  async proxyCall(module: string, method: string, data: any): Promise<any> {
    try {
      // 这里可以根据module和method动态调用相应的服务方法
      // 例如，如果module是'post'，method是'create'，则调用postService.create(data)
      // 这里只是一个简单的示例
      return {
        success: true,
        module,
        method,
        data,
        timestamp: new Date().toISOString(),
        message: '请求已处理',
      };
    } catch (error) {
      return {
        success: false,
        module,
        method,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
