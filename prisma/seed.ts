import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (cuidado em produção!)
  await prisma.$transaction([
    prisma.ticketAttachment.deleteMany(),
    prisma.ticketStatusHistory.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.equipmentPart.deleteMany(),
    prisma.equipment.deleteMany(),
    prisma.space.deleteMany(),
    prisma.userCategory.deleteMany(),
    prisma.userBranch.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.ticketCategory.deleteMany(),
    prisma.team.deleteMany(),
    prisma.branch.deleteMany(),
    prisma.company.deleteMany(),
  ]);

  // 1. Criar empresa
  const company = await prisma.company.create({
    data: {
      id: randomUUID(),
      name: 'TechCorp Brasil',
      cnpj: '12.345.678/0001-90',
      address: 'Av. Paulista, 1000 - São Paulo, SP',
      phone: '(11) 3000-0000',
    },
  });
  console.log('✅ Empresa criada');

  // 2. Criar filial
  const branch = await prisma.branch.create({
    data: {
      id: randomUUID(),
      companyId: company.id,
      name: 'Filial São Paulo - Centro',
      address: 'Rua Augusta, 500 - São Paulo, SP',
      phone: '(11) 3100-0000',
    },
  });
  console.log('✅ Filial criada');

  // 3. Criar espaço
  const space = await prisma.space.create({
    data: {
      id: randomUUID(),
      branchId: branch.id,
      name: 'Data Center Principal',
      description: 'Sala de servidores e equipamentos críticos',
      floor: '3º andar',
    },
  });
  console.log('✅ Espaço criado');

  // 4. Criar time
  const team = await prisma.team.create({
    data: {
      id: randomUUID(),
      name: 'Time de Infraestrutura',
      description: 'Responsável pela manutenção de infraestrutura',
    },
  });
  console.log('✅ Time criado');

  // 5. Criar categorias
  const categories = await Promise.all([
    prisma.ticketCategory.create({
      data: {
        id: randomUUID(),
        name: 'Elétrica',
        description: 'Problemas relacionados à infraestrutura elétrica',
        active: true,
      },
    }),
    prisma.ticketCategory.create({
      data: {
        id: randomUUID(),
        name: 'Ar Condicionado',
        description: 'Manutenção de sistemas de climatização',
        active: true,
      },
    }),
    prisma.ticketCategory.create({
      data: {
        id: randomUUID(),
        name: 'TI / Hardware',
        description: 'Equipamentos de informática',
        active: true,
      },
    }),
  ]);
  console.log('✅ Categorias criadas');

  // 6. Criar usuários
  const hashedPassword = await bcrypt.hash('senha123', 10);

  const admin = await prisma.profile.create({
    data: {
      id: randomUUID(),
      name: 'Admin Sistema',
      email: 'admin@techcorp.com',
      password: hashedPassword,
      phone: '(11) 99000-0001',
      teamId: team.id,
    },
  });

  await prisma.userRole.create({
    data: {
      id: randomUUID(),
      userId: admin.id,
      role: 'ADMIN',
    },
  });

  const manager = await prisma.profile.create({
    data: {
      id: randomUUID(),
      name: 'Maria Gestora',
      email: 'maria@techcorp.com',
      password: hashedPassword,
      phone: '(11) 99000-0002',
      teamId: team.id,
    },
  });

  await prisma.userRole.create({
    data: {
      id: randomUUID(),
      userId: manager.id,
      role: 'MANAGER',
    },
  });

  const operator = await prisma.profile.create({
    data: {
      id: randomUUID(),
      name: 'João Técnico',
      email: 'joao@techcorp.com',
      password: hashedPassword,
      phone: '(11) 99000-0003',
      teamId: team.id,
    },
  });

  await prisma.userRole.create({
    data: {
      id: randomUUID(),
      userId: operator.id,
      role: 'OPERATOR',
    },
  });

  // Atribuir categoria ao operador
  await prisma.userCategory.create({
    data: {
      userId: operator.id,
      categoryId: categories[1].id, // Ar Condicionado
    },
  });

  const user = await prisma.profile.create({
    data: {
      id: randomUUID(),
      name: 'Ana Usuária',
      email: 'ana@techcorp.com',
      password: hashedPassword,
      phone: '(11) 99000-0004',
    },
  });

  await prisma.userRole.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      role: 'USER',
    },
  });

  console.log('✅ Usuários criados');

  // 7. Vincular usuários à filial
  await Promise.all([
    prisma.userBranch.create({
      data: { userId: admin.id, branchId: branch.id },
    }),
    prisma.userBranch.create({
      data: { userId: manager.id, branchId: branch.id },
    }),
    prisma.userBranch.create({
      data: { userId: operator.id, branchId: branch.id },
    }),
    prisma.userBranch.create({
      data: { userId: user.id, branchId: branch.id },
    }),
  ]);

  // 8. Criar equipamento
  const equipment = await prisma.equipment.create({
    data: {
      id: randomUUID(),
      name: 'Ar Condicionado Split 18000 BTUs',
      tag: 'AC-DC-001',
      location: 'Sala de reuniões 1',
      spaceId: space.id,
      manufacturer: 'Samsung',
      model: 'AR18TSHZDWK',
      serialNumber: 'SN123456789',
      active: true,
    },
  });

  await prisma.equipmentPart.create({
    data: {
      id: randomUUID(),
      equipmentId: equipment.id,
      name: 'Compressor',
      manufacturer: 'Samsung',
      partNumber: 'COMP-18K',
      minStock: 2,
      notes: 'Componente crítico - manter estoque mínimo',
      failureCount: 0,
    },
  });

  console.log('✅ Equipamento e peças criados');

  // 9. Criar chamado exemplo
  const ticket = await prisma.ticket.create({
    data: {
      id: randomUUID(),
      title: 'Ar condicionado não resfria',
      description: 'O ar condicionado da sala de reuniões 1 não está resfriando adequadamente',
      status: 'OPEN',
      priority: 'HIGH',
      categoryId: categories[1].id,
      requesterId: user.id,
      equipmentId: equipment.id,
      branchId: branch.id,
    },
  });

  await prisma.ticketStatusHistory.create({
    data: {
      id: randomUUID(),
      ticketId: ticket.id,
      oldStatus: null,
      newStatus: 'OPEN',
      changedById: user.id,
      comment: 'Chamado criado - equipamento apresentando falha',
    },
  });

  console.log('✅ Chamado exemplo criado');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de teste:');
  console.log('-----------------------------------');
  console.log('ADMIN:    admin@techcorp.com / senha123');
  console.log('MANAGER:  maria@techcorp.com / senha123');
  console.log('OPERATOR: joao@techcorp.com  / senha123');
  console.log('USER:     ana@techcorp.com   / senha123');
  console.log('-----------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
