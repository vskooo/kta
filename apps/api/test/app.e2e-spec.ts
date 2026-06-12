import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { PrismaService } from './../src/prisma/prisma.service';

describe('muak API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health responds with status ok', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /api/plans returns active plans', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/plans')
      .expect(200);

    const body = response.body as {
      data: Array<{ id: string; title: string; weight: number }>;
    };

    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
    for (const plan of body.data) {
      expect(plan.id).toBeDefined();
      expect(plan.title).toBeDefined();
      expect(plan.weight).toBeGreaterThanOrEqual(1);
    }
  });

  it('POST /api/spins selects and records a plan', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/spins')
      .expect(201);

    const body = response.body as {
      data: {
        id: string;
        spunAt: string;
        selectedPlan: { id: string; title: string };
      };
    };

    expect(body.data.id).toBeDefined();
    expect(body.data.spunAt).toBeDefined();
    expect(body.data.selectedPlan.id).toBeDefined();

    const stored = await prisma.spin.findUnique({
      where: { id: body.data.id },
    });
    expect(stored?.datePlanId).toBe(body.data.selectedPlan.id);
  });

  it('POST /api/spins rejects a body with extra fields', () => {
    return request(app.getHttpServer())
      .post('/api/spins')
      .send({ datePlanId: 'forced-id' })
      .expect(400);
  });

  it('GET /api/spins/recent respects the limit', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/spins/recent?limit=1')
      .expect(200);

    const body = response.body as { data: unknown[] };
    expect(body.data.length).toBeLessThanOrEqual(1);
  });

  it('GET /api/spins/recent rejects an invalid limit', () => {
    return request(app.getHttpServer())
      .get('/api/spins/recent?limit=999')
      .expect(400);
  });

  describe('with fewer than two active plans', () => {
    let deactivatedIds: string[] = [];

    beforeAll(async () => {
      const plans = await prisma.datePlan.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
        skip: 1,
      });
      deactivatedIds = plans.map((plan) => plan.id);
      await prisma.datePlan.updateMany({
        where: { id: { in: deactivatedIds } },
        data: { isActive: false },
      });
    });

    afterAll(async () => {
      await prisma.datePlan.updateMany({
        where: { id: { in: deactivatedIds } },
        data: { isActive: true },
      });
    });

    it('POST /api/spins responds 409', () => {
      return request(app.getHttpServer()).post('/api/spins').expect(409);
    });
  });
});
