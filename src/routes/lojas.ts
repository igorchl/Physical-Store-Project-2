import { Router, Request, Response } from 'express';
import axios from 'axios';
import { db } from '../database';

const router = Router();

// Função para obter coordenadas do endereço
const getCoordinatesFromAddress = async (address: string): Promise<{ latitude: number; longitude: any }> => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1,
      },
    });
    if (response.data.length === 0) {
      throw new Error('Não foi possível obter as coordenadas para o endereço fornecido.');
    }

    return {
      latitude: parseFloat(response.data[0].lat),
      longitude: parseFloat(response.data[0].lon),
    };
  } catch (error) {
    throw new Error('Erro na geocodificação do endereço.');
  }
};

// Função para obter o endereço completo a partir do CEP
const getAddressFromCEP = async (cep: string): Promise<{ logradouro: string, bairro: string, localidade: string, uf: string }> => {
  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    const data = response.data;

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return {
      logradouro: data.logradouro,
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf
    };
  } catch (error) {
    throw new Error('Erro ao obter endereço do CEP');
  }
};

// Rota para testar Log de erro
router.get('/test-error', (req: Request, res: Response) => {
  throw new Error('Erro intencional para teste');
});



// Rota para buscar lojas por CEP
router.get('/lojas', async (req: Request, res: Response) => {
  const cep = req.query.cep as string;

  if (!cep) {
    return res.status(400).json({ message: 'CEP é obrigatório' });
  }

  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    const data = response.data;

    if (data.erro) {
      return res.status(404).json({ message: 'CEP não encontrado' });
    }

    const address = `${data.logradouro}, ${data.localidade}, ${data.uf}`;
    const { latitude, longitude } = await getCoordinatesFromAddress(address);

    const query = `
      SELECT *
      FROM (
        SELECT *,
        (6371 * acos(
          cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) +
          sin(radians(?)) * sin(radians(latitude))
        )) AS distance
        FROM lojas
      ) AS subquery
      WHERE distance <= 100
      ORDER BY distance ASC;
    `;

    db.all(query, [latitude, longitude, latitude], (err, rows: any[]) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao consultar o banco de dados' });
      }

      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: 'Nenhuma loja encontrada no raio de 100 km' });
      }

      res.json(rows);
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao processar a requisição', error: error.message });
  }
});

// Rota para deletar uma loja
router.delete('/lojas/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'ID é obrigatório para deletar uma loja' });
  }

  try {
    const query = `
      DELETE FROM lojas
      WHERE id = ?
    `;

    db.run(query, [id], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao deletar loja no banco de dados' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Loja não encontrada' });
      }

      res.json({ message: 'Loja deletada com sucesso' });
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao processar a requisição', error: error.message });
  }
});

// Rota para inserir uma nova loja
router.post('/lojas', async (req: Request, res: Response) => {
  const { nome, cep } = req.body;

  if (!nome || !cep) {
    return res.status(400).json({ message: 'Nome e CEP são obrigatórios' });
  }

  try {
    
    const endereco = await getAddressFromCEP(cep);
    const address = `${cep}, Brasil`; 
    const { latitude, longitude } = await getCoordinatesFromAddress(address);

    const query = `
      INSERT INTO lojas (nome, cep, logradouro, bairro, localidade, uf, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [nome, cep, endereco.logradouro, endereco.bairro, endereco.localidade, endereco.uf, latitude, longitude], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao inserir loja no banco de dados' });
      }

      res.status(201).json({ message: 'Loja inserida com sucesso', id: this.lastID });
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao processar a requisição', error: error.message });
  }
});

// Rota para atualizar dados de uma loja
router.put('/lojas/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, cep, latitude, longitude } = req.body;

  if (!nome && !cep && !latitude && !longitude) {
    return res.status(400).json({ message: 'Pelo menos um campo deve ser fornecido para atualização' });
  }

  try {
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (nome) {
      fieldsToUpdate.push('nome = ?');
      values.push(nome);
    }
    if (cep) {
      fieldsToUpdate.push('cep = ?');
      values.push(cep);
    }
    if (latitude) {
      fieldsToUpdate.push('latitude = ?');
      values.push(latitude);
    }
    if (longitude) {
      fieldsToUpdate.push('longitude = ?');
      values.push(longitude);
    }

    values.push(id);

    const query = `
      UPDATE lojas
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = ?
    `;

    db.run(query, values, function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar o banco de dados' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Loja não encontrada' });
      }

      res.json({ message: 'Dados atualizados com sucesso' });
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao processar a requisição', error: error.message });
  }
});

export default router;
