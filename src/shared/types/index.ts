import { AppRole, TicketStatus, TicketPriority } from '@prisma/client';

export { AppRole, TicketStatus, TicketPriority };

export interface JWTPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roles: AppRole[];
  branches: string[];
  categories: string[];
}

export interface CreateTicketDTO {
  title: string;
  description: string;
  priority: TicketPriority;
  categoryId: string;
  equipmentId?: string;
  branchId?: string;
}

export interface AssignOperatorDTO {
  ticketId: string;
  operatorId: string;
}

export interface ChangeTicketStatusDTO {
  ticketId: string;
  newStatus: TicketStatus;
  comment: string;
}

export interface CreateCompanyDTO {
  name: string;
  cnpj?: string;
  address?: string;
  phone?: string;
}

export interface RegisterUserDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: AppRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}
