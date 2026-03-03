# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./
COPY tsup.config.ts ./

# Instalar todas as dependências (incluindo dev)
RUN npm ci

# Copiar código fonte
COPY prisma ./prisma/
COPY src ./src/

# Gerar Prisma Client
RUN npx prisma generate

# Build TypeScript → JavaScript
RUN npm run build

# ==========================================
# Stage 2: Production
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copiar Prisma schema
COPY prisma ./prisma/

# Gerar Prisma Client (necessário em produção)
RUN npx prisma generate

# Copiar código compilado do stage anterior
COPY --from=builder /app/dist ./dist

# Criar diretório de uploads
RUN mkdir -p /app/uploads

# Expor porta
EXPOSE 3000

# Variáveis de ambiente padrão (podem ser sobrescritas)
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Iniciar aplicação
CMD ["node", "dist/server.js"]

