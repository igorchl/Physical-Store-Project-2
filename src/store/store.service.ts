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
      console.log('Coordenadas do usuário:', userCoordinates);
  
      const stores = await this.storeRepository.find();
      console.log('Lojas recuperadas:', stores);
  
      const storeDetails = await Promise.all(
        stores.map(async (store) => {
          console.log('Processando loja:', store.nome);
          console.log('Coordenadas da loja:', { latitude: store.latitude, longitude: store.longitude });
  
          const routeData = await this.getRouteDistanceFromGoogle(
            { lat: userCoordinates.latitude, lng: userCoordinates.longitude },
            { lat: store.latitude, lng: store.longitude },
          );
  
          console.log('Dados da rota calculada:', routeData);
  
          const frete = await this.calcularFreteMelhorEnvio(
            3, // Peso fictício em kg
            10, // Altura fictícia em cm
            15, // Largura fictícia em cm
            20, // Comprimento fictício em cm
            '01005-000', // CEP Origem fictício (loja)
            data.cep, // CEP Destino (usuário)
          );
  
          console.log('Frete calculado com Melhor Envio:', frete);
  
          return {
            loja: store.nome,
            distancia: `${(routeData.distance / 1000).toFixed(2)} km`,
            entregaPrivada: routeData.distance <= 50000 ? 'Disponível (R$15 fixo)' : 'Não disponível',
            tempoEstimado: `${(routeData.duration / 60).toFixed(0)} minutos`,
            frete,
          };
        }),
      );
  
      return { lojas: storeDetails };
    } catch (error) {
      console.error('Erro ao processar a requisição:', error);
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
      console.log('Dados recebidos:', createStoreDto); // Log do corpo recebido
  
      const { nome, cep } = createStoreDto;
  
      const endereco = await this.getAddressFromCEP(cep);
      console.log('Endereço obtido:', endereco); // Log do endereço retornado pelo ViaCEP
  
      const address = `${cep}, Brasil`;
      const { latitude, longitude } = await this.getCoordinatesFromAddress(address);
      console.log('Coordenadas obtidas:', { latitude, longitude }); // Log das coordenadas retornadas
  
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
      console.log('Objeto Loja criado:', newStore); // Log do objeto criado
  
      await this.storeRepository.save(newStore);
      console.log('Loja inserida no banco com sucesso!');
      return { message: 'Loja inserida com sucesso', id: newStore.id };
    } catch (error) {
      console.error('Erro ao inserir loja no banco de dados:', error); // Log do erro exato
      throw new InternalServerErrorException('Erro ao inserir loja no banco de dados');
    }
  }  

  
  private async calcularFreteMelhorEnvio(
    peso: number,
    altura: number,
    largura: number,
    comprimento: number,
    cepOrigem: string,
    cepDestino: string,
  ): Promise<{ valor: number; prazo: string }> {
    try {
      console.log('Dados para cálculo de frete com Melhor Envio:', {
        peso,
        altura,
        largura,
        comprimento,
        cepOrigem,
        cepDestino,
      });
  
      const response = await axios.post(
        'https://melhorenvio.com.br/api/v2/me/shipment/calculate', // Altere para produção conforme necessário
        {
          from: { postal_code: cepOrigem },
          to: { postal_code: cepDestino },
          products: [
            {
              width: largura,
              height: altura,
              length: comprimento,
              weight: peso,
              insurance_value: 0,
              quantity: 1,
            },
          ],
          options: {
            receipt: false,
            own_hand: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MELHOR_ENVIO_API_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'MinhaAplicacao (meuemail@exemplo.com)',
          },
        },
      );
  
      console.log('Resposta da API Melhor Envio:', response.data);
  
      // Filtra o primeiro serviço disponível que tem preço e prazo
      const melhorOpcao = response.data.find((servico) => servico.custom_price && servico.custom_delivery_time);
  
      if (!melhorOpcao) {
        throw new Error('Nenhum serviço disponível com preço ou prazo válido');
      }
  
      return {
        valor: parseFloat(melhorOpcao.custom_price), // Converte o valor para número
        prazo: `${melhorOpcao.custom_delivery_time} dias úteis`, // Usa o prazo ajustado
      };
    } catch (error) {
      console.error('Erro ao calcular frete com Melhor Envio:', error.response?.data || error.message);
      throw new InternalServerErrorException('Erro ao calcular frete com a API do Melhor Envio');
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
    // Log do endereço recebido
    console.log('Endereço recebido para buscar coordenadas:', address);

    // Realiza a requisição à API do Google Maps
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY, // Usa a variável de ambiente para segurança
      },
    });

    // Log da resposta bruta da API do Google Maps
    console.log('Resposta da API Google Maps (geocodificação):', response.data);

    // Verifica se a API retornou resultados
    if (!response.data.results || response.data.results.length === 0) {
      console.error('Nenhuma coordenada encontrada para o endereço:', address);
      throw new Error('Não foi possível obter as coordenadas');
    }

    // Extrai as coordenadas do resultado
    const location = response.data.results[0].geometry.location;

    // Log das coordenadas retornadas
    console.log('Coordenadas obtidas com sucesso:', { latitude: location.lat, longitude: location.lng });

    // Retorna as coordenadas (latitude e longitude)
    return {
      latitude: location.lat,
      longitude: location.lng,
    };
  } catch (error) {
    // Log detalhado de erro, se ocorrer
    console.error('Erro na geocodificação do endereço:', error.response?.data || error.message);
    throw new InternalServerErrorException('Erro na geocodificação do endereço');
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

  public async getRouteDistanceFromGoogle(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<{ distance: number; duration: number }> {
    try {
      // Logs para validar as coordenadas de origem e destino
      console.log('Coordenadas do usuário:', origin);
      console.log('Coordenadas da loja:', destination);
  
      // Chamada à API do Google Maps
      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          key: process.env.GOOGLE_MAPS_API_KEY, // Use a variável de ambiente para a chave da API
        },
      });
  
      // Log da resposta da API Google Maps
      console.log('Resposta da API Google Maps:', response.data);
  
      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error('Nenhuma rota encontrada entre os pontos fornecidos');
      }
  
      const route = response.data.routes[0];
      const leg = route.legs[0];
  
      // Log dos detalhes da rota retornados pela API
      console.log('Distância retornada:', leg.distance.value, 'metros');
      console.log('Duração retornada:', leg.duration.value, 'segundos');
  
      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
      };
    } catch (error) {
      // Log detalhado em caso de erro
      console.error('Erro ao calcular distância usando Google Maps:', error.response?.data || error.message);
      throw new InternalServerErrorException('Erro ao calcular distância usando Google Maps');
    }
  }
  

  
  
}
