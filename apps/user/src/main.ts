import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(UserModule);
  const config = new DocumentBuilder()
    .setTitle('User management')
    .setDescription('The API for managing users')
    .setVersion('1.0')
    .addTag('users')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, documentFactory);
  await app.listen(process.env.port ?? 3001);
}
bootstrap();
