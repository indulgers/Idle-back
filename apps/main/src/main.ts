import { NestFactory } from '@nestjs/core';
import { MainModule } from './main.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(MainModule);

  // 添加微服务支持
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
  await app.listen(process.env.MAIN_SERVICE_PORT ?? 3001, '127.0.0.1');

  console.log(`Main service is running on: ${await app.getUrl()}`);
}
bootstrap();
