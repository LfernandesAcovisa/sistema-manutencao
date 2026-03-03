import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../../infrastructure/database/prisma';
import { NotFoundError } from '../../../shared/errors/app-error';
import { TicketPriority } from '../../../shared/types';
import { randomUUID } from 'crypto';

const createTicketSchema = z.object({
  title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  priority: z.nativeEnum(TicketPriority),
  categoryId: z.string().uuid('ID de categoria inválido'),
  equipmentId: z.string().uuid('ID de equipamento inválido').optional(),
  branchId: z.string().uuid('ID de filial inválido').optional(),
});

export class CreateTicketUseCase {
  async execute(req: Request, res: Response): Promise<Response> {
    const data = createTicketSchema.parse(req.body);
    const requesterId = req.user!.id;

    // Verificar se a categoria existe e está ativa
    const category = await prisma.ticketCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.active) {
      throw new NotFoundError('Categoria não encontrada ou inativa');
    }

    // Verificar se o equipamento existe (se fornecido)
    if (data.equipmentId) {
      const equipment = await prisma.equipment.findUnique({
        where: { id: data.equipmentId },
      });

      if (!equipment) {
        throw new NotFoundError('Equipamento não encontrado');
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        id: randomUUID(),
        title: data.title,
        description: data.description,
        priority: data.priority,
        categoryId: data.categoryId,
        requesterId,
        equipmentId: data.equipmentId,
        branchId: data.branchId,
        status: 'OPEN',
      },
      include: {
        category: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        equipment: true,
        branch: true,
      },
    });

    // Criar histórico inicial
    await prisma.ticketStatusHistory.create({
      data: {
        id: randomUUID(),
        ticketId: ticket.id,
        oldStatus: null,
        newStatus: 'OPEN',
        changedById: requesterId,
        comment: 'Chamado criado',
      },
    });

    return res.status(201).json(ticket);
  }
}
