import { Router, Request, Response } from 'express';
import { authRoutes } from './auth.routes';
import { ticketRoutes } from './ticket.routes';
import { companyRoutes } from './company.routes';

const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/tickets', ticketRoutes);
routes.use('/companies', companyRoutes);

// Rota de health check
routes.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export { routes };
