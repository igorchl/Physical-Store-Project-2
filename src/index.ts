import express from 'express';
import lojasRoute from './routes/lojas';
import { initializeDatabase } from './database';
import winston from 'winston';
import expressWinston from 'express-winston';
import logger from './logger';

const app = express();
const port = 3000;

app.use(express.json());


app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'request.log' })
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
}));

app.use('/api', lojasRoute);


app.use(expressWinston.errorLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log' })
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
}));

const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      logger.info(`Servidor rodando na porta ${port}`);
    });
  } catch (error) {
    logger.error('Erro ao iniciar o servidor:', error);
  }
};

startServer();
