import { NestFactory } from '@nestjs/core';
import { MainModule } from './main.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(MainModule);

  // 添加微服务支持 - 保持在3001端口用于微服务通信
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: parseInt(process.env.MAIN_SERVICE_PORT || '3001'),
    },
  });

  app.enableCors();
  app.setGlobalPrefix('api/main');
  const config = new DocumentBuilder()
    .setTitle('Main server')
    .setDescription('The API for managing main server')
    .setVersion('1.0')
    .addTag('main')
    .addBearerAuth({
      type: 'http',
      description: 'Enter JWT token in format **Bearer** <JWT>',
    })
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/main/doc', app, documentFactory);

  // 启动微服务
  await app.startAllMicroservices();

  // 使用不同的端口(如3011)启动HTTP服务
  const httpPort = parseInt(process.env.MAIN_HTTP_PORT || '3011');
  await app.listen(httpPort);
  console.log(
    `Main service TCP is running on port: ${process.env.MAIN_SERVICE_PORT || '3001'}`,
  );
  console.log(`Main service HTTP is running on: ${await app.getUrl()}`);
}
bootstrap();
