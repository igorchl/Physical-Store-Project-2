import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.GOOGLE_MAPS_API_KEY) {
  throw new Error('Variáveis de ambiente ausentes! Certifique-se de configurar o arquivo .env corretamente.');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  const config = new DocumentBuilder()
    .setTitle('Physical Store API') 
    .setDescription('Documentação da API para o gerenciamento de lojas físicas') 
    .setVersion('1.0') 
    .addTag('stores') 
    .build();
  const document = SwaggerModule.createDocument(app, config);

  
  SwaggerModule.setup('api', app, document); 

  
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
