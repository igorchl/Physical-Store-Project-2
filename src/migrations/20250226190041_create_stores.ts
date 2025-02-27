import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("stores", (table) => {
    table.increments("id").primary(); // ID auto-incrementado
    table.string("name").notNullable(); // Nome da loja
    table.string("cep").notNullable().unique(); // CEP único
    table.string("address").notNullable(); // Endereço
    table.string("neighborhood").notNullable(); // Bairro
    table.string("city").notNullable(); // Cidade
    table.string("state").notNullable(); // Estado
    table.timestamp("created_at").defaultTo(knex.fn.now()); // Data de criação
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("stores"); // Remove a tabela se precisar reverter
}
