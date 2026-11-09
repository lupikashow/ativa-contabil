import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Essencial para permitir a comunicação entre o Frontend e o Backend sem falha de rede
  app.enableCors();

  await app.listen(3000);
}
bootstrap();