import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { PlanCategory } from '../src/generated/prisma/enums';

const initialPlans: Array<{
  title: string;
  description: string;
  emoji: string;
  category: PlanCategory;
  weight: number;
}> = [
  {
    title: 'Picnic con vista',
    description: 'Preparar algo rico y buscar un lugar bonito para conversar.',
    emoji: '🧺',
    category: PlanCategory.ADVENTURE,
    weight: 1,
  },
  {
    title: 'Cafecito y paseo',
    description: 'Elegir una cafetería y caminar sin apuro.',
    emoji: '☕',
    category: PlanCategory.FOOD,
    weight: 1,
  },
  {
    title: 'Cena casera juntos',
    description: 'Cocinar algo rico entre los dos.',
    emoji: '🍝',
    category: PlanCategory.HOME,
    weight: 1,
  },
  {
    title: 'Mirar el atardecer',
    description: 'Buscar un lugar tranquilo y ver caer el sol.',
    emoji: '🌄',
    category: PlanCategory.RELAX,
    weight: 1,
  },
  {
    title: 'Caminata en la naturaleza',
    description: 'Salir a recorrer un sendero o parque.',
    emoji: '🥾',
    category: PlanCategory.ADVENTURE,
    weight: 1,
  },
  {
    title: 'Noche de películas',
    description: 'Elegir una película, mantita y algo para picar.',
    emoji: '🎬',
    category: PlanCategory.HOME,
    weight: 1,
  },
  {
    title: 'Probar un lugar nuevo',
    description: 'Conocer un restaurante o rincón distinto.',
    emoji: '🗺️',
    category: PlanCategory.FOOD,
    weight: 1,
  },
  {
    title: 'Cita sorpresa',
    description: 'Uno organiza y el otro solo debe dejarse sorprender.',
    emoji: '✨',
    category: PlanCategory.SURPRISE,
    weight: 1,
  },
];

async function main(): Promise<void> {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    for (const plan of initialPlans) {
      const existing = await prisma.datePlan.findFirst({
        where: { title: plan.title },
        select: { id: true },
      });

      if (existing) {
        continue;
      }

      await prisma.datePlan.create({ data: plan });
    }

    const total = await prisma.datePlan.count();
    console.log(`Seed completado. Panoramas en la base de datos: ${total}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Error al ejecutar el seed:', error);
  process.exitCode = 1;
});
