import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { startNacos } from './nacos';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // startNacos();
  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
