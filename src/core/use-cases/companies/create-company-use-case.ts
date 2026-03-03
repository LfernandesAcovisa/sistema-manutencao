import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../../infrastructure/database/prisma';
import { randomUUID } from 'crypto';

const createCompanySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export class CreateCompanyUseCase {
  async execute(req: Request, res: Response): Promise<Response> {
    const data = createCompanySchema.parse(req.body);

    const company = await prisma.company.create({
      data: {
        id: randomUUID(),
        ...data,
      },
    });

    return res.status(201).json(company);
  }
}
