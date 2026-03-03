import { app } from './app';
import { config } from './shared/config';
import prisma from './infrastructure/database/prisma';

const PORT = config.port;

async function startServer() {
  try {
    // Testar conexão com o banco
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados PostgreSQL');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 Ambiente: ${config.nodeEnv}`);
      console.log(`🔗 API disponível em: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Encerrando servidor...');
  await prisma.$disconnect();
  console.log('✅ Conexão com banco fechada');
  process.exit(0);
});

startServer();
