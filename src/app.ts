import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { routes } from './infrastructure/http/routes';
import { errorHandler } from './infrastructure/http/middlewares/error-handler';

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Rotas
app.use('/api', routes);

// Middleware de erro (deve ser o último)
app.use(errorHandler);

export { app };
