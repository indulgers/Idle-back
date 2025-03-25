import { NestFactory } from '@nestjs/core';
import { MainModule } from './main.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(MainModule);

  // 添加微服务支持 - 使用MAIN_SERVICE_PORT(3001)作为TCP端口
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

  // 使用MAIN_HTTP_PORT(3011)作为HTTP端口
  const httpPort = parseInt(process.env.MAIN_HTTP_PORT || '3011');
  await app.listen(httpPort, '0.0.0.0'); // 绑定到所有接口，使Docker中可访问

  console.log(
    `Main service TCP is running on port: ${process.env.MAIN_SERVICE_PORT || '3001'}`,
  );
  console.log(`Main service HTTP is running on: ${await app.getUrl()}`);
}
bootstrap();
