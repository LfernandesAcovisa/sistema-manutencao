# 📅 Integração com Google Calendar API

Este guia mostra como integrar o Google Calendar no sistema de manutenção para agendar chamados e sincronizar eventos.

## 📋 Pré-requisitos

1. Conta Google (Google Workspace ou Gmail)
2. Projeto no Google Cloud Console
3. Google Calendar API habilitada
4. Credenciais OAuth 2.0 ou Service Account

---

## 🔧 Configuração do Google Cloud

### 1. Criar Projeto

1. Acesse: https://console.cloud.google.com
2. Clique em **"Criar Projeto"**
3. Nome: `maintenance-system` (ou outro de sua escolha)
4. Clique em **"Criar"**

### 2. Habilitar Google Calendar API

1. No menu lateral, vá em **"APIs e Serviços" → "Biblioteca"**
2. Busque por **"Google Calendar API"**
3. Clique em **"Ativar"**

### 3. Criar Credenciais OAuth 2.0

**Para aplicações que acessam calendário do usuário:**

1. Vá em **"APIs e Serviços" → "Credenciais"**
2. Clique em **"Criar Credenciais" → "ID do cliente OAuth 2.0"**
3. Tipo de aplicativo: **"Aplicativo da Web"**
4. Nome: `Maintenance System Backend`
5. URIs de redirecionamento autorizados:
   - `http://localhost:3000/auth/google/callback` (desenvolvimento)
   - `https://seudominio.com/auth/google/callback` (produção)
6. Clique em **"Criar"**
7. **Baixe o arquivo JSON** com as credenciais

### 4. Configurar Tela de Consentimento OAuth

1. Vá em **"APIs e Serviços" → "Tela de consentimento OAuth"**
2. Tipo de usuário: **"Interno"** (se Google Workspace) ou **"Externo"**
3. Preencha as informações básicas
4. Adicione escopo: `https://www.googleapis.com/auth/calendar`
5. Salve

---

## 📦 Instalação de Dependências

```bash
npm install googleapis @google-cloud/local-auth
```

Adicione ao `package.json`:
```json
{
  "dependencies": {
    "googleapis": "^129.0.0"
  }
}
```

---

## ⚙️ Configuração no Projeto

### 1. Adicionar Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# Google Calendar API
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_CALENDAR_ID=primary
```

### 2. Criar Serviço de Calendar

Crie: `src/infrastructure/services/google-calendar.service.js`

```javascript
import { google } from 'googleapis';
import { config } from '../../shared/config.js';

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Gerar URL de autorização
  getAuthUrl() {
    const scopes = ['https://www.googleapis.com/auth/calendar'];
    
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  // Trocar código de autorização por tokens
  async getTokensFromCode(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  // Definir tokens manualmente
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Criar evento no calendário
  async createEvent({ summary, description, startTime, endTime, attendees = [] }) {
    const event = {
      summary,
      description,
      start: {
        dateTime: startTime,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endTime,
        timeZone: 'America/Sao_Paulo',
      },
      attendees: attendees.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 dia antes
          { method: 'popup', minutes: 30 },      // 30 min antes
        ],
      },
    };

    const response = await this.calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      resource: event,
      sendUpdates: 'all',
    });

    return response.data;
  }

  // Atualizar evento
  async updateEvent(eventId, updates) {
    const event = await this.calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    const updatedEvent = {
      ...event.data,
      ...updates,
    };

    const response = await this.calendar.events.update({
      calendarId: 'primary',
      eventId,
      resource: updatedEvent,
      sendUpdates: 'all',
    });

    return response.data;
  }

  // Deletar evento
  async deleteEvent(eventId) {
    await this.calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    });
  }

  // Listar eventos
  async listEvents({ timeMin, timeMax, maxResults = 10 }) {
    const response = await this.calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  }

  // Verificar disponibilidade (FreeBusy)
  async checkAvailability({ emails, timeMin, timeMax }) {
    const response = await this.calendar.freebusy.query({
      resource: {
        timeMin,
        timeMax,
        items: emails.map(email => ({ id: email })),
      },
    });

    return response.data;
  }
}

export default new GoogleCalendarService();
```

---

## 🔐 Implementar Fluxo OAuth

### 1. Criar Use Case de Autorização

`src/core/use-cases/google-auth-use-case.js`

```javascript
import googleCalendarService from '../../infrastructure/services/google-calendar.service.js';
import prisma from '../../infrastructure/database/prisma.js';

export class GoogleAuthUseCase {
  // Iniciar autorização
  async getAuthUrl(req, res) {
    const userId = req.user.id;
    const authUrl = googleCalendarService.getAuthUrl();
    
    // Armazenar userId em session ou state
    return res.json({ authUrl });
  }

  // Callback OAuth
  async handleCallback(req, res) {
    const { code } = req.query;
    const userId = req.user.id;

    try {
      const tokens = await googleCalendarService.getTokensFromCode(code);
      
      // Salvar tokens no banco (criptografado em produção!)
      await prisma.profile.update({
        where: { id: userId },
        data: {
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
        },
      });

      return res.json({ success: true, message: 'Calendário conectado!' });
    } catch (error) {
      return res.status(400).json({ error: 'Erro na autenticação' });
    }
  }
}
```

### 2. Adicionar Rotas OAuth

`src/infrastructure/http/routes/google.routes.js`

```javascript
import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { GoogleAuthUseCase } from '../../../core/use-cases/google-auth-use-case.js';

const googleRoutes = Router();
const googleAuthUseCase = new GoogleAuthUseCase();

googleRoutes.use(authenticate);

googleRoutes.get('/auth', (req, res) => googleAuthUseCase.getAuthUrl(req, res));
googleRoutes.get('/callback', (req, res) => googleAuthUseCase.handleCallback(req, res));

export { googleRoutes };
```

Adicione às rotas principais:
```javascript
import { googleRoutes } from './google.routes.js';
routes.use('/google', googleRoutes);
```

---

## 🎯 Integrar com Chamados

### Use Case: Criar Evento ao Atribuir Operador

`src/core/use-cases/tickets/assign-with-calendar-use-case.js`

```javascript
import googleCalendarService from '../../../infrastructure/services/google-calendar.service.js';
import prisma from '../../../infrastructure/database/prisma.js';

export class AssignOperatorWithCalendarUseCase {
  async execute(req, res) {
    const { ticketId, operatorId, scheduledDate } = req.body;

    // Buscar operador com tokens do Google
    const operator = await prisma.profile.findUnique({
      where: { id: operatorId },
    });

    if (operator.googleAccessToken) {
      // Configurar credenciais do operador
      googleCalendarService.setCredentials({
        access_token: operator.googleAccessToken,
        refresh_token: operator.googleRefreshToken,
      });

      // Buscar ticket
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { requester: true, equipment: true },
      });

      // Criar evento no calendário
      const event = await googleCalendarService.createEvent({
        summary: `Manutenção: ${ticket.title}`,
        description: `
Chamado #${ticket.id.slice(0, 8)}
Solicitante: ${ticket.requester.name}
Equipamento: ${ticket.equipment?.name || 'N/A'}

Descrição:
${ticket.description}
        `.trim(),
        startTime: scheduledDate,
        endTime: new Date(new Date(scheduledDate).getTime() + 2 * 60 * 60 * 1000), // +2h
        attendees: [ticket.requester.email],
      });

      // Salvar ID do evento no ticket
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          operatorId,
          status: 'IN_PROGRESS',
          googleCalendarEventId: event.id,
        },
      });

      return res.json({ ticket, calendarEvent: event });
    }

    // Atribuir sem calendário se operador não conectou
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { operatorId, status: 'IN_PROGRESS' },
    });

    return res.json({ ticket });
  }
}
```

---

## 📊 Casos de Uso Comuns

### 1. Agendar Manutenção Preventiva

```javascript
// Criar evento recorrente
await googleCalendarService.createEvent({
  summary: 'Manutenção Preventiva - Ar Condicionado',
  description: 'Limpeza trimestral dos filtros',
  startTime: '2024-04-01T09:00:00',
  endTime: '2024-04-01T11:00:00',
  recurrence: ['RRULE:FREQ=MONTHLY;INTERVAL=3'],
  attendees: ['tecnico@empresa.com'],
});
```

### 2. Verificar Disponibilidade do Técnico

```javascript
const availability = await googleCalendarService.checkAvailability({
  emails: ['joao@techcorp.com'],
  timeMin: '2024-03-15T08:00:00Z',
  timeMax: '2024-03-15T18:00:00Z',
});

// availability.calendars['joao@techcorp.com'].busy
// Retorna intervalos ocupados
```

### 3. Notificações de Lembrete

```javascript
// O Google Calendar envia automaticamente:
// - Email 1 dia antes
// - Notificação popup 30 min antes
// (conforme configurado no createEvent)
```

---

## 🔒 Segurança

### 1. Criptografar Tokens

Use uma biblioteca como `crypto` para criptografar tokens no banco:

```javascript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

### 2. Refresh Tokens

Implemente rotação automática de tokens:

```javascript
async function refreshAccessToken(refreshToken) {
  googleCalendarService.oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });
  
  const { credentials } = await googleCalendarService.oauth2Client.refreshAccessToken();
  return credentials;
}
```

---

## 🧪 Testando a Integração

### 1. Conectar Calendário

```bash
# Login
POST /api/auth/login
{ "email": "joao@techcorp.com", "password": "senha123" }

# Obter URL de autorização
GET /api/google/auth
Authorization: Bearer {token}

# Resposta:
{ "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..." }

# Abrir URL no navegador → Autorizar → Será redirecionado para callback
```

### 2. Criar Evento de Teste

```bash
POST /api/tickets/assign-with-calendar
Authorization: Bearer {token}
{
  "ticketId": "uuid-do-ticket",
  "operatorId": "uuid-do-operador",
  "scheduledDate": "2024-03-20T14:00:00"
}
```

---

## 📚 Recursos Adicionais

- [Google Calendar API Docs](https://developers.google.com/calendar/api/v3/reference)
- [OAuth 2.0 Google](https://developers.google.com/identity/protocols/oauth2)
- [googleapis Node.js](https://github.com/googleapis/google-api-nodejs-client)

---

## ✅ Checklist de Implementação

- [ ] Projeto criado no Google Cloud Console
- [ ] Google Calendar API habilitada
- [ ] Credenciais OAuth 2.0 criadas
- [ ] Dependências instaladas (`googleapis`)
- [ ] Variáveis de ambiente configuradas
- [ ] Serviço de Calendar criado
- [ ] Rotas de OAuth implementadas
- [ ] Tokens salvos (criptografados) no banco
- [ ] Integração com tickets funcionando
- [ ] Testes realizados

---

**Pronto! Agora você pode integrar o Google Calendar no seu sistema de manutenção! 📅✨**
