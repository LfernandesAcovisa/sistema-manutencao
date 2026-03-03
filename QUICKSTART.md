# 🚀 Guia de Início Rápido

## Configuração Inicial em 5 Passos

### 1️⃣ Instalar Dependências

```bash
npm install
```

### 2️⃣ Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

O arquivo `.env` já vem configurado para desenvolvimento local. Se necessário, ajuste:
```env
DATABASE_URL="postgresql://maintenance:maintenance123@localhost:5432/maintenance_db?schema=public"
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3️⃣ Iniciar Banco de Dados

```bash
docker-compose up -d postgres
```

Aguarde alguns segundos para o PostgreSQL iniciar completamente.

### 4️⃣ Configurar Banco de Dados

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# Popular com dados de exemplo
npm run prisma:seed
```

### 5️⃣ Iniciar Servidor

```bash
npm run dev
```

✅ API rodando em: **http://localhost:3000/api**

---

## 🧪 Testar a API

### Opção 1: cURL

```bash
# Health Check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techcorp.com",
    "password": "senha123"
  }'
```

### Opção 2: Postman/Insomnia

Importe o arquivo `requests.http` ou use os exemplos abaixo.

### Opção 3: VS Code REST Client

Instale a extensão "REST Client" e abra o arquivo `requests.http`.

---

## 👥 Usuários de Teste

Após rodar o seed, estes usuários estarão disponíveis:

| Papel    | Email                  | Senha    | Permissões                          |
|----------|------------------------|----------|-------------------------------------|
| ADMIN    | admin@techcorp.com     | senha123 | Acesso total                        |
| MANAGER  | maria@techcorp.com     | senha123 | Gerenciar chamados                  |
| OPERATOR | joao@techcorp.com      | senha123 | Executar chamados                   |
| USER     | ana@techcorp.com       | senha123 | Criar e visualizar próprios chamados|

---

## 📝 Fluxo Básico de Uso

### 1. Fazer Login

```bash
POST /api/auth/login
{
  "email": "ana@techcorp.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "user": { "id": "...", "name": "Ana Usuária", "roles": ["USER"] },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copie o token** para usar nas próximas requisições.

### 2. Criar Chamado

```bash
POST /api/tickets
Authorization: Bearer {seu-token}
{
  "title": "Impressora não funciona",
  "description": "A impressora do 3º andar está apresentando erro ao imprimir",
  "priority": "MEDIUM",
  "categoryId": "{uuid-da-categoria}"
}
```

### 3. Listar Chamados

```bash
GET /api/tickets
Authorization: Bearer {seu-token}
```

### 4. Atribuir Operador (como MANAGER)

Faça login como `maria@techcorp.com`:

```bash
POST /api/tickets/assign-operator
Authorization: Bearer {token-do-manager}
{
  "ticketId": "{uuid-do-chamado}",
  "operatorId": "{uuid-do-operador}"
}
```

### 5. Alterar Status (como OPERATOR)

Faça login como `joao@techcorp.com`:

```bash
PATCH /api/tickets/status
Authorization: Bearer {token-do-operator}
{
  "ticketId": "{uuid}",
  "newStatus": "IN_PROGRESS",
  "comment": "Iniciando manutenção"
}
```

---

## 🔍 Verificar Banco de Dados

Abrir Prisma Studio (interface gráfica):

```bash
npm run prisma:studio
```

Acesse: **http://localhost:5555**

---

## 🛠️ Comandos Úteis

```bash
# Ver logs do PostgreSQL
docker-compose logs -f postgres

# Parar todos os containers
docker-compose down

# Parar e remover volumes (limpa banco)
docker-compose down -v

# Resetar banco (limpar + rodar migrations + seed)
npm run prisma:migrate -- reset

# Ver status dos containers
docker-compose ps
```

---

## ❌ Problemas Comuns

### Erro: "Can't reach database server"

**Solução:**
```bash
# Certifique-se que o PostgreSQL está rodando
docker-compose ps

# Se não estiver, inicie-o
docker-compose up -d postgres

# Aguarde 5-10 segundos e tente novamente
```

### Erro: "Invalid `prisma.xxx()` invocation"

**Solução:**
```bash
# Regenerar Prisma Client
npm run prisma:generate
```

### Erro: "Port 5432 already in use"

**Solução:**
```bash
# Parar PostgreSQL local (se estiver rodando)
sudo service postgresql stop

# Ou mudar a porta no docker-compose.yaml:
# ports: - "5433:5432"
# E atualizar DATABASE_URL no .env
```

### Erro: "Token inválido"

**Solução:**
- Verifique se está enviando o header: `Authorization: Bearer {token}`
- Certifique-se de copiar o token completo do login
- Tokens expiram em 7 dias (configurável no .env)

---

## 📚 Próximos Passos

1. Explorar endpoints no arquivo `requests.http`
2. Testar diferentes papéis (ADMIN, MANAGER, OPERATOR, USER)
3. Visualizar dados no Prisma Studio
4. Implementar novos endpoints
5. Integrar com frontend

---

## 🆘 Precisa de Ajuda?

- Documentação completa: `README.md`
- Exemplos de requisições: `requests.http`
- Documentação Prisma: https://www.prisma.io/docs
- Documentação Express: https://expressjs.com/

---

**Pronto! Agora você tem um sistema de gestão de manutenção funcionando! 🎉**
