import { Router } from 'express';
import { AuthenticateUseCase } from '../../../core/use-cases/auth/authenticate-use-case';
import { RegisterUseCase } from '../../../core/use-cases/auth/register-use-case';

const authRoutes = Router();

const authenticateUseCase = new AuthenticateUseCase();
const registerUseCase = new RegisterUseCase();

authRoutes.post('/login', (req, res) => authenticateUseCase.execute(req, res));
authRoutes.post('/register', (req, res) => registerUseCase.execute(req, res));

export { authRoutes };
