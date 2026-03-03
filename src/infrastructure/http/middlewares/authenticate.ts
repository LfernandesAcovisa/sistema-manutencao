import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../../shared/config';
import { UnauthorizedError } from '../../../shared/errors/app-error';
import { JWTPayload, AuthenticatedUser } from '../../../shared/types';
import prisma from '../../database/prisma';

// Estender interface do Express para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError('Token não fornecido');
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    const user = await prisma.profile.findUnique({
      where: { id: decoded.sub },
      include: {
        userRoles: true,
        userBranches: true,
        userCategories: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.userRoles.map((ur) => ur.role),
      branches: user.userBranches.map((ub) => ub.branchId),
      categories: user.userCategories.map((uc) => uc.categoryId),
    };

    next();
  } catch (error) {
    throw new UnauthorizedError('Token inválido');
  }
}
