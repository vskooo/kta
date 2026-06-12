import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PlansService } from './plans.service';

describe('PlansService', () => {
  let service: PlansService;

  const prismaMock = {
    datePlan: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PlansService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(PlansService);
  });

  it('queries only active plans in stable order', async () => {
    prismaMock.datePlan.findMany.mockResolvedValue([]);

    await service.findActivePlans();

    expect(prismaMock.datePlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
    );
  });

  it('returns the plans provided by the database', async () => {
    const plans = [
      {
        id: 'plan-a',
        title: 'Picnic con vista',
        description: null,
        emoji: '🧺',
        category: 'ADVENTURE',
        weight: 1,
      },
    ];
    prismaMock.datePlan.findMany.mockResolvedValue(plans);

    await expect(service.findActivePlans()).resolves.toEqual(plans);
  });
});
