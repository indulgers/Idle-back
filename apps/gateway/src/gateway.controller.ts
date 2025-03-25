import {
  Controller,
  Get,
  All,
  Req,
  Res,
  Inject,
  HttpStatus,
} from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller()
export class GatewayController {
  constructor(
    private readonly gatewayService: GatewayService,
    @Inject('MAIN_SERVICE') private readonly mainClient: ClientProxy,
    @Inject('CONTENT_SERVICE') private readonly contentClient: ClientProxy,
    private readonly httpService: HttpService,
  ) {}

  @Get()
  getHello(): string {
    return this.gatewayService.getHello();
  }

  @All('api/main/*')
  async forwardToMainService(@Req() req: Request, @Res() res: Response) {
    const path = req.path.replace('/api/main/', '');
    try {
      // 使用HTTP_PORT而非SERVICE_PORT转发HTTP请求
      const mainHttpPort = process.env.MAIN_HTTP_PORT || '3011';
      const mainServiceUrl = `http://${process.env.MAIN_SERVICE_HOST || 'localhost'}:${mainHttpPort}/api/main/${path}`;
      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method as any,
          url: mainServiceUrl,
          data: req.body,
          headers: {
            ...req.headers,
            host: undefined,
            'if-none-match': undefined, // 移除if-none-match头，避免304响应
            'if-modified-since': undefined, // 移除if-modified-since头，避免304响应
          },
          params: req.query,
          validateStatus: (status) => status < 500, // 接受所有非500错误的状态码
        }),
      );

      // 设置响应头
      Object.entries(response.headers).forEach(([key, value]) => {
        if (key !== 'content-length' && key !== 'content-type') {
          res.setHeader(key, value);
        }
      });

      // 处理不同的状态码
      if (response.status === 304) {
        res.status(200).json({ message: 'Not Modified' });
      } else {
        res.status(response.status).json(response.data);
      }
    } catch (error) {
      console.error('Error forwarding to main service:', error.message);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error forwarding request to main service',
        error: error.message,
      });
    }
  }

  @All('api/content/*')
  async forwardToContentService(@Req() req: Request, @Res() res: Response) {
    const path = req.path.replace('/api/content/', '');
    try {
      // 使用HTTP_PORT而非SERVICE_PORT转发HTTP请求
      const contentHttpPort = process.env.CONTENT_HTTP_PORT || '3014';
      const contentServiceUrl = `http://${process.env.CONTENT_SERVICE_HOST || 'localhost'}:${contentHttpPort}/api/content/${path}`;
      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method as any,
          url: contentServiceUrl,
          data: req.body,
          headers: {
            ...req.headers,
            host: undefined,
            'if-none-match': undefined, // 移除if-none-match头，避免304响应
            'if-modified-since': undefined, // 移除if-modified-since头，避免304响应
          },
          params: req.query,
          validateStatus: (status) => status < 500, // 接受所有非500错误的状态码
        }),
      );

      // 设置响应头
      Object.entries(response.headers).forEach(([key, value]) => {
        if (key !== 'content-length' && key !== 'content-type') {
          res.setHeader(key, value);
        }
      });

      // 处理不同的状态码
      if (response.status === 304) {
        res.status(200).json({ message: 'Not Modified' });
      } else {
        res.status(response.status).json(response.data);
      }
    } catch (error) {
      console.error('Error forwarding to content service:', error.message);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error forwarding request to content service',
        error: error.message,
      });
    }
  }
}
