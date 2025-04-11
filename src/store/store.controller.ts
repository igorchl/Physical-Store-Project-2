import { Controller, Get, Post, Put, Delete, Query, Param, Body, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { StoreService } from './store.service';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // Rota de teste de erro
  @Get('test-error')
  testError() {
    throw new InternalServerErrorException('Erro intencional para teste');
  }

  @Get()
async getStores(@Query('cep') cep: string) {
  if (!cep) {
    throw new BadRequestException('CEP é obrigatório');
  }
  return this.storeService.findStoresByCep(cep);
}


  // Deletar loja por ID
  @Delete(':id')
  async deleteStore(@Param('id') id: string) {
    if (!id) {
      throw new NotFoundException('ID é obrigatório para deletar uma loja');
    }
    return this.storeService.deleteStoreById(id); // Delegar ao serviço
  }

  // Criar nova loja
  @Post()
  async createStore(@Body() createStoreDto: { nome: string; cep: string }) {
    const { nome, cep } = createStoreDto;

    if (!nome || !cep) {
      throw new BadRequestException('Nome e CEP são obrigatórios');
    }
    return this.storeService.createStore(createStoreDto); // Delegar ao serviço
  }

  // Atualizar loja por ID
  @Put(':id')
  async updateStore(
    @Param('id') id: string,
    @Body() updateStoreDto: { nome?: string; cep?: string; latitude?: number; longitude?: number },
  ) {
    if (!Object.keys(updateStoreDto).length) {
      throw new BadRequestException('Pelo menos um campo deve ser fornecido para atualização');
    }
    return this.storeService.updateStore(id, updateStoreDto); // Delegar ao serviço
  }
}

