import { NestFactory } from '@nestjs/core';
import { MainModule } from './main.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(MainModule);
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
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
