import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../../../shared/errors/app-error';
import { AppRole } from '../../../shared/types';

export function authorize(...allowedRoles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRoles = req.user?.roles || [];
    
    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));
    
    if (!hasPermission) {
      throw new ForbiddenError('Você não tem permissão para acessar este recurso');
    }
    
    next();
  };
}
