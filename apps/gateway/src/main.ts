import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule, {
    bodyParser: false, // 禁用默认的body解析器
  });
  
  // 配置请求体解析
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription('The API Gateway for microservices')
    .setVersion('1.0')
    .addTag('gateway')
    .addBearerAuth({
      type: 'http',
      description: 'Enter JWT token in format **Bearer** <JWT>',
    })
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/doc', app, documentFactory);

  await app.listen(process.env.GATEWAY_PORT ?? 3000);
  console.log(`Gateway is running on: ${await app.getUrl()}`);
}
bootstrap();
