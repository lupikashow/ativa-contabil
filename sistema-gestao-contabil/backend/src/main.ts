import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ATIVA O CORS PARA O FRONTEND LIGAR AO BACKEND SEM BLOQUEIOS
  app.enableCors();

  await app.listen(3000);
}
bootstrap();