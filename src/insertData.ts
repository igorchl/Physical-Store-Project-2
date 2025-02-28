import { db } from './database';

interface Loja {
  nome: string;
  cep: string;
  latitude: number;
  longitude: number;
}

const lojas: Loja[] = [
  {
    nome: 'Loja A',
    cep: '01001-000',
    latitude: -23.5475,
    longitude: -46.6361,
  },

];

export const insertSampleData = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM lojas',
      (err: Error | null, row: { count: number } | undefined) => {
        if (err) {
          return reject(err);
        }

        if (row === undefined) {
          return reject(new Error('Nenhum resultado retornado do banco de dados.'));
        }

        if (row.count === 0) {
        
          const stmt = db.prepare(
            'INSERT INTO lojas (nome, cep, latitude, longitude) VALUES (?, ?, ?, ?)'
          );

          lojas.forEach((loja) => {
            stmt.run(loja.nome, loja.cep, loja.latitude, loja.longitude);
          });

          stmt.finalize((err) => {
            if (err) reject(err);
            else {
              console.log('Dados de exemplo inseridos no banco de dados.');
              resolve();
            }
          });
        } else {
          console.log('Dados já existentes no banco de dados.');
          resolve();
        }
      }
    );
  });
};
