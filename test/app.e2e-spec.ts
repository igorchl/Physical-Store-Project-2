import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { AppModule } from '../src/app.module';
import { StoreService } from '../src/store/store.service';
import { StoreEntity } from '../src/store/store.entity';
import axios from 'axios';

dotenv.config({ path: './test/.env.test' }); 
jest.mock('axios'); 

describe('StoreController (e2e)', () => {
  let app: INestApplication;
  let storeService: StoreService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: './test/database_test.sqlite', 
          entities: [StoreEntity], 
          synchronize: true, 
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    
    storeService = app.get<StoreService>(StoreService);

    
    const storeRepository = app.get('StoreEntityRepository');
    await storeRepository.save([
      {
        id: 1,
        nome: 'Loja Teste 1',
        cep: '01001-000',
        logradouro: 'Rua A', 
        bairro: 'Centro',
        localidade: 'São Paulo',
        uf: 'SP',
        latitude: -23.55,
        longitude: -46.63,
      },
      {
        id: 2,
        nome: 'Loja Teste 2',
        cep: '01002-000',
        logradouro: 'Rua B', 
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
        latitude: -23.56,
        longitude: -46.64,
      },
    ]);
  });

  afterAll(async () => {
    const storeRepository = app.get('StoreEntityRepository');
    await storeRepository.clear(); 
    await app.close(); 
  });

  describe('Testes dos Métodos do StoreService', () => {
    it('Deve atualizar os dados de uma loja existente', async () => {
      const updatedData = { nome: 'Loja Atualizada' };
      const result = await storeService.updateStore('1', updatedData);
      expect(result).toEqual({ message: 'Dados atualizados com sucesso' });
    });

    it('Deve lançar erro ao tentar atualizar uma loja inexistente', async () => {
      await expect(storeService.updateStore('999', { nome: 'Loja Inexistente' })).rejects.toThrow();
    });

    it('Deve retornar coordenadas válidas para um endereço', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          results: [
            { geometry: { location: { lat: -23.55, lng: -46.63 } } },
          ],
        },
      });
      const result = await storeService.getCoordinatesFromAddress('Praça da Sé, São Paulo, SP');
      expect(result).toEqual({ latitude: -23.55, longitude: -46.63 });
    });

    it('Deve lançar erro caso a API Google Maps não retorne coordenadas', async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { results: [] } });
      await expect(storeService.getCoordinatesFromAddress('Endereço Inválido')).rejects.toThrow();
    });

    it('Deve retornar o endereço correspondente a um CEP', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          logradouro: 'Praça da Sé',
          bairro: 'Sé',
          localidade: 'São Paulo',
          uf: 'SP',
        },
      });
      const result = await storeService.getAddressFromCEP('01001-000');
      expect(result).toEqual({
        logradouro: 'Praça da Sé',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
      });
    });

    it('Deve lançar erro caso o CEP não seja encontrado', async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { erro: true } });
      await expect(storeService.getAddressFromCEP('00000-000')).rejects.toThrow();
    });

    it('Deve retornar a distância e duração entre dois pontos', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          routes: [
            {
              legs: [
                { distance: { value: 1500 }, duration: { value: 300 } },
              ],
            },
          ],
        },
      });
      const result = await storeService.getRouteDistanceFromGoogle(
        { lat: -23.55, lng: -46.63 },
        { lat: -23.56, lng: -46.64 },
      );
      expect(result).toEqual({ distance: 1500, duration: 300 });
    });

    it('Deve lançar erro caso a API Google Maps não encontre rotas', async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { routes: [] } });
      await expect(
        storeService.getRouteDistanceFromGoogle(
          { lat: -23.55, lng: -46.63 },
          { lat: -23.56, lng: -46.64 },
        ),
      ).rejects.toThrow();
    });

    it('Deve calcular fretes com a API Melhor Envio', async () => {
      (axios.post as jest.Mock).mockResolvedValue({
        data: [
          {
            name: 'PAC',
            custom_price: '25.00',
            custom_delivery_time: '5',
          },
          {
            name: 'SEDEX',
            custom_price: '35.00',
            custom_delivery_time: '2',
          },
        ],
      });

      const result = await storeService.calcularFreteMelhorEnvio(
        3, 
        10, 
        15, 
        20, 
        '01001-000', 
        '01002-000', 
      );

      expect(result).toEqual({
        fretes: [
          { tipo: 'PAC', valor: 25.0, prazo: '5 dias úteis' },
          { tipo: 'SEDEX', valor: 35.0, prazo: '2 dias úteis' },
        ],
      });
    });

    it('Deve lançar erro caso a API Melhor Envio retorne um problema', async () => {
      (axios.post as jest.Mock).mockRejectedValue({
        response: {
          data: { message: 'Erro na API Melhor Envio' },
        },
        message: 'Request failed',
      });

      await expect(
        storeService.calcularFreteMelhorEnvio(
          3, 
          10, 
          15, 
          20, 
          '01001-000', 
          '01002-000', 
        ),
      ).rejects.toThrow('Erro ao calcular frete com a API do Melhor Envio');
    });
  });
});
