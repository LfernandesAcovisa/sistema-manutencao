import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { CreateCompanyUseCase } from '../../../core/use-cases/companies/create-company-use-case';

const companyRoutes = Router();

const createCompanyUseCase = new CreateCompanyUseCase();

// Todas as rotas requerem autenticação e papel ADMIN
companyRoutes.use(authenticate);
companyRoutes.use(authorize('ADMIN'));

companyRoutes.post('/', (req, res) => createCompanyUseCase.execute(req, res));

export { companyRoutes };
