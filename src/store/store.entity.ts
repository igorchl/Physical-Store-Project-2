import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity() // Indica que esta classe é uma entidade do TypeORM
export class StoreEntity {
  @PrimaryGeneratedColumn() // Define que este campo é a chave primária e será gerada automaticamente
  id: number;

  @Column() // Define um campo simples para armazenar o nome
  nome: string;

  @Column() // CEP da loja
  cep: string;

  @Column() // Endereço completo da loja
  logradouro: string;

  @Column() // Bairro da loja
  bairro: string;

  @Column() // Cidade da loja
  localidade: string;

  @Column() // Estado da loja
  uf: string;

  @Column() // Latitude para localização
  latitude: number;

  @Column() // Longitude para localização
  longitude: number;
}
