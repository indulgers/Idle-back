import { NestFactory } from '@nestjs/core';
import { ContentModule } from './content.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(ContentModule);

  // 添加微服务支持
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: parseInt(process.env.CONTENT_SERVICE_PORT || '3004'),
    },
  });

  app.enableCors();
  app.setGlobalPrefix('api/content');
  const config = new DocumentBuilder()
    .setTitle('Content server')
    .setDescription('The API for managing content')
    .setVersion('1.0')
    .addTag('content')
    .addBearerAuth({
      type: 'http',
      description: 'Enter JWT token in format **Bearer** <JWT>',
    })
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/content/doc', app, documentFactory);

  // 启动微服务
  await app.startAllMicroservices();
  await app.listen(process.env.CONTENT_SERVICE_PORT ?? 3004, '127.0.0.1');
  console.log(`Content service is running on: ${await app.getUrl()}`);
}
bootstrap();
