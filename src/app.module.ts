import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importar o TypeOrmModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StoreModule } from './store/store.module';
import { DeliveryModule } from './delivery/delivery.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite', // Define o tipo do banco de dados
      database: './db/physical-store.sqlite', // Caminho para o arquivo do banco de dados
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // Local das entidades
      synchronize: true, // Cria tabelas automaticamente (desligue em produção)
    }),
    StoreModule,
    DeliveryModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
