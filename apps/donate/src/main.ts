import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DonateModule } from './donate.module';
import { Transport } from '@nestjs/microservices';
async function bootstrap() {
  const app = await NestFactory.create(DonateModule);
  const config = new DocumentBuilder()
    .setTitle('Donate API')
    .setDescription('The donate API description')
    .setVersion('1.0')
    .addTag('donate')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      port: 8888,
    },
  });
  await app.startAllMicroservices();
  await app.listen(process.env.port ?? 3002);
}
bootstrap();
