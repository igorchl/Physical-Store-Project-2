import express from 'express';
import lojasRoute from './routes/lojas';
import { initializeDatabase } from './database';

const app = express();
const port = 3000;

app.use(express.json());
app.use('/api', lojasRoute);

const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
  }
};

startServer();
