import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity() 
export class StoreEntity {
  @PrimaryGeneratedColumn() 
  id: number;

  @Column() 
  nome: string;

  @Column() 
  cep: string;

  @Column() 
  logradouro: string;

  @Column() 
  bairro: string;

  @Column() 
  localidade: string;

  @Column() 
  uf: string;

  @Column('float') 
  latitude: number;

  @Column('float') 
  longitude: number;
}
