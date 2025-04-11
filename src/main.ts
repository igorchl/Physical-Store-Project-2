import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv'; // Carregar o pacote dotenv

// Carregar as variáveis de ambiente
dotenv.config();

// Validar as variáveis de ambiente
if (!process.env.GOOGLE_MAPS_API_KEY) {
  throw new Error('Variáveis de ambiente ausentes! Certifique-se de configurar o arquivo .env corretamente.');
}


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
