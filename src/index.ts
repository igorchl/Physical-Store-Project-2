import express, { Request, Response } from 'express';
import { findNearbyStores } from './storeService';

const app = express();
const port = 3000;

app.get('/stores/:cep', async (req: Request, res: Response) => {
    const { cep } = req.params;
  
    try {
      const stores = await findNearbyStores(cep);
      res.json(stores);
    } catch (error: any) {  // Aqui, usamos `any` para permitir o acesso sem erro
      res.status(500).json({ message: 'Erro ao buscar lojas', error: error.message });
    }
  });
  