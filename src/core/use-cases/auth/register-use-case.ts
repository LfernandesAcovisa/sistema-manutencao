import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../../../infrastructure/database/prisma';
import { ValidationError } from '../../../shared/errors/app-error';
import { AppRole } from '../../../shared/types';
import { randomUUID } from 'crypto';

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  phone: z.string().optional(),
  role: z.nativeEnum(AppRole).default(AppRole.USER),
});

export class RegisterUseCase {
  async execute(req: Request, res: Response): Promise<Response> {
    const data = registerSchema.parse(req.body);

    const userExists = await prisma.profile.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new ValidationError('Email já está em uso');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.profile.create({
      data: {
        id: randomUUID(),
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        userRoles: {
          create: {
            id: randomUUID(),
            role: data.role,
          },
        },
      },
      include: {
        userRoles: true,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      user: {
        ...userWithoutPassword,
        roles: user.userRoles.map((ur) => ur.role),
      },
    });
  }
}
