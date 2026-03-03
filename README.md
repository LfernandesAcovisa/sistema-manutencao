# Sistema de Gestão de Manutenção - Backend TypeScript

Backend Node.js + TypeScript para sistema multi-tenant de gestão de chamados de manutenção, seguindo **Clean Architecture, SOLID e DDD**.

## 🛠️ Tecnologias

- **Node.js** 20+
- **TypeScript** 5.5+
- **Express** - Framework web
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** 16 - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Zod** - Validação de schemas
- **Docker** - Containerização
- **tsx** - Execução TypeScript em desenvolvimento
- **tsup** - Build otimizado

## 🏗️ Arquitetura

```
src/
├── core/                      # Camada de domínio (DDD)
│   ├── entities/             # Entidades de negócio
│   ├── repositories/         # Interfaces de repositórios
│   └── use-cases/            # Casos de uso (controllers)
│       ├── auth/
│       ├── companies/
│       └── tickets/
├── infrastructure/           # Camada de infraestrutura
│   ├── database/            # Conexão Prisma
│   └── http/                # Express, rotas, middlewares
│       ├── middlewares/
│       └── routes/
├── shared/                  # Código compartilhado
│   ├── config.ts           # Configurações
│   ├── errors/             # Erros customizados
│   ├── types/              # Tipos TypeScript
│   └── utils/              # Utilitários
├── app.ts                  # Configuração Express
└── server.ts               # Inicialização do servidor
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- PostgreSQL 16 (ou via Docker)

### Instalação

1. **Instale as dependências:**
```bash
npm install
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

3. **Inicie o PostgreSQL via Docker:**
```bash
docker-compose up -d postgres
```

4. **Execute as migrations e seed:**
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. **Inicie o servidor em desenvolvimento:**
```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

## 🏗️ Build para Produção

```bash
# Build TypeScript → JavaScript
npm run build

# Iniciar servidor de produção
npm start
```

## 📋 Scripts Disponíveis

```bash
npm run dev               # Desenvolvimento (hot reload com tsx)
npm run build            # Build TypeScript → dist/
npm start                # Produção (node dist/server.js)
npm run type-check       # Verificar tipos TypeScript
npm run prisma:generate  # Gerar Prisma Client
npm run prisma:migrate   # Executar migrations
npm run prisma:studio    # Abrir Prisma Studio (GUI)
npm run prisma:seed      # Popular banco com dados
```

## 🔐 Autenticação e Autorização

### Papéis (Roles)

```typescript
enum AppRole {
  ADMIN     // Acesso total ao sistema
  MANAGER   // Gerencia chamados e atribui operadores
  OPERATOR  // Executa chamados atribuídos
  USER      // Cria e visualiza próprios chamados
}
```

### Endpoints de Autenticação

**POST** `/api/auth/register`
```typescript
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "phone": "11999999999",
  "role": "USER"
}
```

**POST** `/api/auth/login`
```typescript
{
  "email": "joao@example.com",
  "password": "senha123"
}
```

Resposta:
```typescript
{
  "user": {
    id: string;
    name: string;
    email: string;
    roles: AppRole[];
  },
  "token": string
}
```

## 📡 Endpoints da API

### Health Check
- **GET** `/api/health` - Status da API

### Autenticação
- **POST** `/api/auth/register` - Registrar usuário
- **POST** `/api/auth/login` - Login

### Empresas (ADMIN apenas)
- **POST** `/api/companies` - Criar empresa

### Chamados
- **POST** `/api/tickets` - Criar chamado (autenticado)
- **GET** `/api/tickets` - Listar chamados (filtrado por papel)
- **POST** `/api/tickets/assign-operator` - Atribuir operador (ADMIN/MANAGER)
- **PATCH** `/api/tickets/status` - Alterar status (ADMIN/MANAGER/OPERATOR)

## 🔄 Fluxo de Status dos Chamados

```typescript
enum TicketStatus {
  OPEN          // Aberto
  IN_PROGRESS   // Em andamento
  WAITING_PART  // Aguardando peça
  CLOSED        // Encerrado
  CANCELED      // Cancelado
}

// Transições permitidas
const validTransitions = {
  OPEN: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['WAITING_PART', 'CLOSED', 'CANCELED'],
  WAITING_PART: ['IN_PROGRESS', 'CANCELED'],
  CLOSED: [],
  CANCELED: [],
};
```

## 📊 Tipos TypeScript

O projeto utiliza tipagem forte em todos os lugares:

```typescript
// DTOs
interface CreateTicketDTO {
  title: string;
  description: string;
  priority: TicketPriority;
  categoryId: string;
  equipmentId?: string;
  branchId?: string;
}

// User autenticado
interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roles: AppRole[];
  branches: string[];
  categories: string[];
}
```

## 🐳 Docker

### Desenvolvimento (apenas PostgreSQL)
```bash
docker-compose up -d postgres
```

### Produção (PostgreSQL + API)
```bash
docker-compose up -d
```

## 👥 Usuários de Teste

Após rodar o seed:

| Papel    | Email                  | Senha    |
|----------|------------------------|----------|
| ADMIN    | admin@techcorp.com     | senha123 |
| MANAGER  | maria@techcorp.com     | senha123 |
| OPERATOR | joao@techcorp.com      | senha123 |
| USER     | ana@techcorp.com       | senha123 |

## 🔒 Segurança

- ✅ Senhas hashadas com bcrypt (10 rounds)
- ✅ JWT para autenticação stateless
- ✅ RBAC (Role-Based Access Control) implementado
- ✅ Validação de entrada com Zod
- ✅ Tratamento centralizado de erros
- ✅ Tipagem forte com TypeScript
- ✅ Express Request tipado com usuário autenticado

## 🧪 Testes

```bash
# Verificar tipos
npm run type-check

# Build (valida TypeScript)
npm run build
```

## 📝 Integração Google Calendar

Veja o arquivo `GOOGLE_CALENDAR_INTEGRATION.md` para instruções completas de como integrar o Google Calendar API no sistema.

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

MIT License

---

**Desenvolvido com TypeScript, Clean Architecture e SOLID principles 🚀**
