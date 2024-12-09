import { NestFactory } from '@nestjs/core';
import { DonateModule } from './donate.module';
import { Transport } from '@nestjs/microservices';
async function bootstrap() {
  const app = await NestFactory.create(DonateModule);
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
