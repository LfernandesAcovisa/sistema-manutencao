import { Request, Response } from 'express';
import prisma from '../../../infrastructure/database/prisma';
import { TicketStatus, TicketPriority } from '../../../shared/types';

export class ListTicketsUseCase {
  async execute(req: Request, res: Response): Promise<Response> {
    const { status, priority, categoryId, branchId } = req.query;
    const user = req.user!;

    const where: any = {};

    // Filtros opcionais
    if (status) where.status = status as TicketStatus;
    if (priority) where.priority = priority as TicketPriority;
    if (categoryId) where.categoryId = categoryId as string;
    if (branchId) where.branchId = branchId as string;

    // RBAC: Controle de acesso baseado em papel
    const isAdmin = user.roles.includes('ADMIN');
    const isManager = user.roles.includes('MANAGER');
    const isOperator = user.roles.includes('OPERATOR');

    if (!isAdmin && !isManager) {
      // OPERATOR e USER veem apenas seus próprios chamados ou atribuídos a eles
      where.OR = [
        { requesterId: user.id },
        { operatorId: user.id },
      ];

      // OPERATOR também vê chamados de suas categorias
      if (isOperator && user.categories.length > 0) {
        where.OR.push({
          categoryId: { in: user.categories },
        });
      }
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        category: true,
        requester: {
          select: { id: true, name: true, email: true },
        },
        operator: {
          select: { id: true, name: true, email: true },
        },
        equipment: true,
        branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(tickets);
  }
}
