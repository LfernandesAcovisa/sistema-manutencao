import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../../../infrastructure/database/prisma';
import { UnauthorizedError } from '../../../shared/errors/app-error';
import { config } from '../../../shared/config';

const authenticateSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export class AuthenticateUseCase {
  async execute(req: Request, res: Response): Promise<Response> {
    const { email, password } = authenticateSchema.parse(req.body);

    const user = await prisma.profile.findUnique({
      where: { email },
      include: {
        userRoles: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    );

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      user: {
        ...userWithoutPassword,
        roles: user.userRoles.map((ur) => ur.role),
      },
      token,
    });
  }
}
