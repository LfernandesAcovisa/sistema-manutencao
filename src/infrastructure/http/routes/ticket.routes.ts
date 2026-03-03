import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { CreateTicketUseCase } from '../../../core/use-cases/tickets/create-ticket-use-case';
import { ListTicketsUseCase } from '../../../core/use-cases/tickets/list-tickets-use-case';
import { AssignOperatorUseCase } from '../../../core/use-cases/tickets/assign-operator-use-case';
import { ChangeTicketStatusUseCase } from '../../../core/use-cases/tickets/change-ticket-status-use-case';

const ticketRoutes = Router();

const createTicketUseCase = new CreateTicketUseCase();
const listTicketsUseCase = new ListTicketsUseCase();
const assignOperatorUseCase = new AssignOperatorUseCase();
const changeTicketStatusUseCase = new ChangeTicketStatusUseCase();

// Todas as rotas requerem autenticação
ticketRoutes.use(authenticate);

// Criar chamado (todos autenticados)
ticketRoutes.post('/', (req, res) => createTicketUseCase.execute(req, res));

// Listar chamados (todos autenticados, com filtro por papel)
ticketRoutes.get('/', (req, res) => listTicketsUseCase.execute(req, res));

// Atribuir operador (apenas ADMIN e MANAGER)
ticketRoutes.post(
  '/assign-operator',
  authorize('ADMIN', 'MANAGER'),
  (req, res) => assignOperatorUseCase.execute(req, res)
);

// Alterar status (ADMIN, MANAGER, OPERATOR)
ticketRoutes.patch(
  '/status',
  authorize('ADMIN', 'MANAGER', 'OPERATOR'),
  (req, res) => changeTicketStatusUseCase.execute(req, res)
);

export { ticketRoutes };
