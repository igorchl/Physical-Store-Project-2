import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from './store.entity';
import axios from 'axios';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  // Método para buscar lojas e calcular entregas
  async findStoresByCep(cep: string): Promise<any> {
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      const data = response.data;

      if (data.erro) {
        throw new NotFoundException('CEP não encontrado');
      }

      const userCoordinates = await this.getCoordinatesFromAddress(
        `${data.logradouro}, ${data.localidade}, ${data.uf}`,
      );

      const stores = await this.storeRepository.find();

      const storeDetails = await Promise.all(
        stores.map(async (store) => {
          const routeData = await this.getRouteDistanceFromGoogle(
            { lat: userCoordinates.latitude, lng: userCoordinates.longitude },
            { lat: store.latitude, lng: store.longitude },
          );

          const isPrivateDeliveryAvailable =
            routeData.distance <= 50000 ? 'Disponível (R$15 fixo)' : 'Não disponível';

          return {
            loja: store.nome,
            distancia: `${(routeData.distance / 1000).toFixed(2)} km`,
            entregaPrivada: isPrivateDeliveryAvailable,
            tempoEstimado: `${(routeData.duration / 60).toFixed(0)} minutos`,
          };
        }),
      );

      const freteOptions = await this.getFreteOptions(cep);

      return {
        lojas: storeDetails,
        frete: freteOptions,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao processar a requisição');
    }
  }

  // Método para deletar uma loja por ID
  async deleteStoreById(id: string) {
    const result = await this.storeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Loja não encontrada');
    }
    return { message: 'Loja deletada com sucesso' };
  }

  // Método para criar uma nova loja
  async createStore(createStoreDto: { nome: string; cep: string }) {
    try {
      const { nome, cep } = createStoreDto;

      const endereco = await this.getAddressFromCEP(cep);
      const address = `${cep}, Brasil`;
      const { latitude, longitude } = await this.getCoordinatesFromAddress(address);

      const newStore = this.storeRepository.create({
        nome,
        cep,
        logradouro: endereco.logradouro,
        bairro: endereco.bairro,
        localidade: endereco.localidade,
        uf: endereco.uf,
        latitude,
        longitude,
      });

      await this.storeRepository.save(newStore);
      return { message: 'Loja inserida com sucesso', id: newStore.id };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao inserir loja no banco de dados');
    }
  }

  // Método para atualizar loja por ID
  async updateStore(id: string, updateStoreDto: { nome?: string; cep?: string; latitude?: number; longitude?: number }) {
    const store = await this.storeRepository.findOne({ where: { id: Number(id) } });
    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    Object.assign(store, updateStoreDto);
    await this.storeRepository.save(store);

    return { message: 'Dados atualizados com sucesso' };
  }

  // Método público para obter coordenadas de um endereço
  public async getCoordinatesFromAddress(address: string): Promise<{ latitude: number; longitude: number }> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: 'YOUR_GOOGLE_MAPS_API_KEY',
        },
      });

      if (response.data.results.length === 0) {
        throw new Error('Não foi possível obter as coordenadas');
      }

      const location = response.data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro na geocodificação do endereço');
    }
  }

  // Método público para calcular fretes usando a API dos Correios
  public async getFreteOptions(cep: string): Promise<any[]> {
    try {
      const responseSedex = await axios.post('https://api.correios.com.br/frete', {
        sCepOrigem: '12345678',
        sCepDestino: cep,
        nVlPeso: 1,
        nCdFormato: 1,
        nVlComprimento: 20,
        nVlAltura: 10,
        nVlLargura: 15,
        sCdMaoPropria: 'N',
        nVlValorDeclarado: 0,
        sCdAvisoRecebimento: 'N',
        nCdServico: '40010',
      });

      const responsePac = await axios.post('https://api.correios.com.br/frete', {
        sCepOrigem: '12345678',
        sCepDestino: cep,
        nVlPeso: 1,
        nCdFormato: 1,
        nVlComprimento: 20,
        nVlAltura: 10,
        nVlLargura: 15,
        sCdMaoPropria: 'N',
        nVlValorDeclarado: 0,
        sCdAvisoRecebimento: 'N',
        nCdServico: '41106',
      });

      return [
        { tipo: 'Sedex', valor: responseSedex.data.valor, prazo: responseSedex.data.prazoEntrega },
        { tipo: 'PAC', valor: responsePac.data.valor, prazo: responsePac.data.prazoEntrega },
      ];
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao calcular fretes');
    }
  }

  // Método público para obter endereço a partir do CEP
  public async getAddressFromCEP(cep: string): Promise<{ logradouro: string; bairro: string; localidade: string; uf: string }> {
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      const data = response.data;

      if (data.erro) {
        throw new NotFoundException('CEP não encontrado');
      }

      return {
        logradouro: data.logradouro,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao obter endereço do CEP');
    }
  }

  // Método público para calcular a distância e a rota usando o Google Maps
  public async getRouteDistanceFromGoogle(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<{ distance: number; duration: number }> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          key: 'YOUR_GOOGLE_MAPS_API_KEY',
        },
      });

      const route = response.data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao calcular distância usando Google Maps');
    }
  }
}
