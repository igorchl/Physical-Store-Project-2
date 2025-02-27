import db from "./db"; // importando a instância do db configurada
import { logger } from "./logger";

// Função para buscar lojas no banco de dados
export async function findNearbyStores(userCep: string) {
    try {
        // Buscando lojas cadastradas no banco com um CEP similar ao do usuário
        const stores = await db("stores").where("cep", userCep); // Usando o knex para buscar lojas pelo CEP
        
        if (!stores.length) {
            throw new Error("Nenhuma loja encontrada para o CEP fornecido.");
        }

        return stores;
    } catch (error) {
        logger.error("Erro ao buscar lojas:", error);
        throw new Error("Erro ao buscar lojas.");
    }
}
