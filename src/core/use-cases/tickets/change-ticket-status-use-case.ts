import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../../infrastructure/database/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../shared/errors/app-error';
import { TicketStatus } from '../../../shared/types';
import { randomUUID } from 'crypto';

const changeStatusSchema = z.object({
  ticketId: z.string().uuid('ID de chamado inválido'),
  newStatus: z.nativeEnum(TicketStatus),
  comment: z.string().min(5, 'Comentário deve ter no mínimo 5 caracteres'),
});

const validTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['WAITING_PART', 'CLOSED', 'CANCELED'],
  WAITING_PART: ['IN_PROGRESS', 'CANCELED'],
  CLOSED: [],
  CANCELED: [],
};

export class ChangeTicketStatusUseCase {
  async execute(req: Request, res: Response): Promise<Response> {
    const { ticketId, newStatus, comment } = changeStatusSchema.parse(req.body);
    const userId = req.user!.id;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: true,
      },
    });

    if (!ticket) {
      throw new NotFoundError('Chamado não encontrado');
    }

    // Validar transição de status
    const allowedTransitions = validTransitions[ticket.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new ValidationError(
        `Transição de ${ticket.status} para ${newStatus} não é permitida`
      );
    }

    // Apenas o solicitante pode encerrar (CLOSED)
    if (newStatus === 'CLOSED' && ticket.requesterId !== userId) {
      throw new ForbiddenError('Apenas o solicitante pode encerrar o chamado');
    }

    const updateData: any = {
      status: newStatus,
    };

    if (newStatus === 'IN_PROGRESS' && !ticket.startedAt) {
      updateData.startedAt = new Date();
    }

    if (newStatus === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        category: true,
        requester: { select: { id: true, name: true, email: true } },
        operator: { select: { id: true, name: true, email: true } },
        equipment: true,
        branch: true,
      },
    });

    await prisma.ticketStatusHistory.create({
      data: {
        id: randomUUID(),
        ticketId,
        oldStatus: ticket.status,
        newStatus,
        changedById: userId,
        comment,
      },
    });

    return res.json(updatedTicket);
  }
}
