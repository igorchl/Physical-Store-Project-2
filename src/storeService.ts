import db from "./db"; 
import { logger } from "./logger";
import axios from "axios"; 


async function getAddressByCep(cep: string) {
    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        return response.data;
    } catch (error) {
        throw new Error("Erro ao buscar CEP no ViaCEP");
    }
}


export async function findNearbyStores(userCep: string) {
    try {
        
        const userAddress = await getAddressByCep(userCep);
        if (!userAddress || userAddress.erro) {
            throw new Error("CEP inválido ou não encontrado.");
        }

        const { bairro, localidade, uf } = userAddress; 

        
        const stores = await db("stores")
            .where("city", localidade)
            .andWhere("state", uf);

        if (!stores.length) {
            throw new Error("Nenhuma loja encontrada na sua região.");
        }

        return stores;
    } catch (error) {
        logger.error("Erro ao buscar lojas:", error);
        throw new Error("Erro ao buscar lojas.");
    }
}
