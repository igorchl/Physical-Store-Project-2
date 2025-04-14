import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('stores') 
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('test-error')
  @ApiOperation({ summary: 'Testar erro intencional' }) 
  @ApiResponse({ status: 500, description: 'Erro interno intencional para teste' }) 
  testError() {
    throw new InternalServerErrorException('Erro intencional para teste');
  }



  @Get('state/:state')
@ApiOperation({ summary: 'Buscar lojas por estado com paginação' }) 
@ApiParam({ name: 'state', required: true, example: 'SP', description: 'Estado das lojas a serem buscadas' }) 
@ApiQuery({ name: 'limit', required: false, example: 10, description: 'Número máximo de lojas a serem retornadas' }) 
@ApiQuery({ name: 'offset', required: false, example: 0, description: 'Ponto inicial para a paginação' }) 
@ApiResponse({ status: 200, description: 'Lista de lojas retornada com sucesso.' }) 
@ApiResponse({ status: 404, description: 'Nenhuma loja encontrada para este estado.' }) 
async getStoresByState(
  @Param('state') state: string,
  @Query('limit') limit: number,
  @Query('offset') offset: number,
) {
  const stores = await this.storeService.getStoresByState(state, limit ?? 10, offset ?? 0);
  if (!stores || stores.stores.length === 0) {
    throw new NotFoundException('Nenhuma loja encontrada para este estado.');
  }
  return stores;
}





@Get(':id')
@ApiOperation({ summary: 'Buscar loja específica pelo ID' }) 
@ApiParam({ name: 'id', required: true, example: '123', description: 'ID da loja a ser buscada' }) 
@ApiResponse({ status: 200, description: 'Loja encontrada com sucesso.' }) 
@ApiResponse({ status: 404, description: 'Loja não encontrada.' }) 
async getStoreById(@Param('id') id: string) {
  const store = await this.storeService.getStoreById(id);
  if (!store) {
    throw new NotFoundException('Loja não encontrada.');
  }
  return store;
}



  @Get()
  @ApiOperation({ summary: 'Buscar lojas pelo CEP' }) 
  @ApiQuery({ name: 'cep', required: true, example: '01001-000', description: 'CEP da loja' }) 
  @ApiResponse({ status: 200, description: 'Lista de lojas retornadas com sucesso.' }) 
  @ApiResponse({ status: 400, description: 'CEP é obrigatório.' }) 
  async getStores(@Query('cep') cep: string) {
    if (!cep) {
      throw new BadRequestException('CEP é obrigatório');
    }
    return this.storeService.findStoresByCep(cep);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar uma loja pelo ID' }) 
  @ApiParam({ name: 'id', required: true, example: '123', description: 'ID da loja a ser deletada' }) 
  @ApiResponse({ status: 200, description: 'Loja deletada com sucesso.' }) 
  @ApiResponse({ status: 404, description: 'ID é obrigatório para deletar uma loja.' }) 
  async deleteStore(@Param('id') id: string) {
    if (!id) {
      throw new NotFoundException('ID é obrigatório para deletar uma loja');
    }
    return this.storeService.deleteStoreById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar uma nova loja' }) 
  @ApiBody({
    description: 'Dados necessários para criar uma loja',
    required: true,
    schema: {
      example: {
        nome: 'Loja Teste',
        cep: '01001-000',
      },
    },
  }) 
  @ApiResponse({ status: 201, description: 'Loja criada com sucesso.' }) 
  @ApiResponse({ status: 400, description: 'Nome e CEP são obrigatórios.' }) 
  async createStore(@Body() createStoreDto: { nome: string; cep: string }) {
    const { nome, cep } = createStoreDto;

    if (!nome || !cep) {
      throw new BadRequestException('Nome e CEP são obrigatórios');
    }
    return this.storeService.createStore(createStoreDto);
  }

  @Get('list-all')
  @ApiOperation({ summary: 'Listar todas as lojas com paginação' }) 
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Número máximo de lojas a serem retornadas' }) 
  @ApiQuery({ name: 'offset', required: false, example: 0, description: 'Ponto inicial para a paginação' }) 
  @ApiResponse({ status: 200, description: 'Lista de lojas retornadas com sucesso.' }) 
  async listAllStores(@Query('limit') limit: number, @Query('offset') offset: number) {
    return this.storeService.listAllStores(limit ?? 10, offset ?? 0);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar os dados de uma loja' }) 
  @ApiParam({ name: 'id', required: true, example: '123', description: 'ID da loja a ser atualizada' }) 
  @ApiBody({
    description: 'Campos que podem ser atualizados',
    required: true,
    schema: {
      example: {
        nome: 'Loja Atualizada',
        cep: '01002-000',
        latitude: -23.55,
        longitude: -46.63,
      },
    },
  }) 
  @ApiResponse({ status: 200, description: 'Loja atualizada com sucesso.' }) 
  @ApiResponse({ status: 400, description: 'Pelo menos um campo deve ser fornecido para atualização.' }) 
  async updateStore(
    @Param('id') id: string,
    @Body() updateStoreDto: { nome?: string; cep?: string; latitude?: number; longitude?: number },
  ) {
    if (!Object.keys(updateStoreDto).length) {
      throw new BadRequestException('Pelo menos um campo deve ser fornecido para atualização');
    }
    return this.storeService.updateStore(id, updateStoreDto);
  }
}
