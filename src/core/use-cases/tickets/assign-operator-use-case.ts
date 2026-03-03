import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../../infrastructure/database/prisma';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/app-error';
import { randomUUID } from 'crypto';

const assignOperatorSchema = z.object({
  ticketId: z.string().uuid('ID de chamado inválido'),
  operatorId: z.string().uuid('ID de operador inválido'),
});

export class AssignOperatorUseCase {
  async execute(req: Request, res: Response): Promise<Response> {
    const { ticketId, operatorId } = assignOperatorSchema.parse(req.body);
    const userId = req.user!.id;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundError('Chamado não encontrado');
    }

    // Verificar se o operador existe e tem o papel OPERATOR
    const operator = await prisma.profile.findUnique({
      where: { id: operatorId },
      include: { userRoles: true },
    });

    if (!operator) {
      throw new NotFoundError('Operador não encontrado');
    }

    const isOperator = operator.userRoles.some((ur) => ur.role === 'OPERATOR');
    if (!isOperator) {
      throw new ForbiddenError('Usuário não é um operador');
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        operatorId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
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
        newStatus: 'IN_PROGRESS',
        changedById: userId,
        comment: `Operador ${operator.name} atribuído ao chamado`,
      },
    });

    return res.json(updatedTicket);
  }
}
