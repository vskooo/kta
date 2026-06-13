import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { SpinDecision } from './dto/decide-spin.dto';
import { SpinsService } from './spins.service';

jest.mock('node:crypto', () => ({
  randomInt: jest.fn(),
}));

import { randomInt } from 'node:crypto';

const randomIntMock = randomInt as unknown as jest.Mock;

describe('SpinsService', () => {
  let service: SpinsService;

  const prismaMock = {
    datePlan: { findMany: jest.fn() },
    spin: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const configMock = {
    get: jest.fn().mockReturnValue(10),
  };

  const mailMock = {
    sendSpinDecision: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        SpinsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
        { provide: MailService, useValue: mailMock },
      ],
    }).compile();

    service = moduleRef.get(SpinsService);
  });

  describe('spin', () => {
    it('selects and records a spin with two or more valid plans', async () => {
      prismaMock.datePlan.findMany.mockResolvedValue([
        { id: 'plan-a', weight: 1 },
        { id: 'plan-b', weight: 1 },
      ]);
      randomIntMock.mockReturnValue(1);
      prismaMock.spin.create.mockResolvedValue({
        id: 'spin-1',
        spunAt: new Date('2026-06-10T20:00:00.000Z'),
        datePlan: {
          id: 'plan-b',
          title: 'Mirar el atardecer',
          description: 'Buscar un lugar tranquilo y ver caer el sol.',
          emoji: '🌄',
          category: 'RELAX',
        },
      });

      const result = await service.spin();

      expect(prismaMock.spin.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { datePlanId: 'plan-b' } }),
      );
      expect(result.id).toBe('spin-1');
      expect(result.selectedPlan.id).toBe('plan-b');
    });

    it('throws ConflictException with only one active plan', async () => {
      prismaMock.datePlan.findMany.mockResolvedValue([
        { id: 'plan-a', weight: 1 },
      ]);

      await expect(service.spin()).rejects.toBeInstanceOf(ConflictException);
      expect(prismaMock.spin.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException with no active plans', async () => {
      prismaMock.datePlan.findMany.mockResolvedValue([]);

      await expect(service.spin()).rejects.toBeInstanceOf(ConflictException);
      expect(prismaMock.spin.create).not.toHaveBeenCalled();
    });
  });

  describe('pickWeighted', () => {
    it('respects different weights when accumulating', () => {
      const plans = [
        { id: 'plan-a', weight: 1 },
        { id: 'plan-b', weight: 3 },
        { id: 'plan-c', weight: 2 },
      ];

      randomIntMock.mockReturnValue(0);
      expect(service.pickWeighted(plans).id).toBe('plan-a');

      randomIntMock.mockReturnValue(1);
      expect(service.pickWeighted(plans).id).toBe('plan-b');

      randomIntMock.mockReturnValue(3);
      expect(service.pickWeighted(plans).id).toBe('plan-b');

      randomIntMock.mockReturnValue(4);
      expect(service.pickWeighted(plans).id).toBe('plan-c');

      randomIntMock.mockReturnValue(5);
      expect(service.pickWeighted(plans).id).toBe('plan-c');
    });

    it('uses the total weight as the random range', () => {
      const plans = [
        { id: 'plan-a', weight: 2 },
        { id: 'plan-b', weight: 5 },
      ];
      randomIntMock.mockReturnValue(0);

      service.pickWeighted(plans);

      expect(randomIntMock).toHaveBeenCalledWith(7);
    });

    it('throws on invalid weight', () => {
      const plans = [
        { id: 'plan-a', weight: 0 },
        { id: 'plan-b', weight: 1 },
      ];

      expect(() => service.pickWeighted(plans)).toThrow(
        InternalServerErrorException,
      );
    });

    it('throws on non-integer weight', () => {
      const plans = [
        { id: 'plan-a', weight: 1.5 },
        { id: 'plan-b', weight: 1 },
      ];

      expect(() => service.pickWeighted(plans)).toThrow(
        InternalServerErrorException,
      );
    });

    it('throws on weight above the maximum', () => {
      const plans = [
        { id: 'plan-a', weight: 101 },
        { id: 'plan-b', weight: 1 },
      ];

      expect(() => service.pickWeighted(plans)).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findRecent', () => {
    it('uses the default limit when none is provided', async () => {
      prismaMock.spin.findMany.mockResolvedValue([]);

      await service.findRecent();

      expect(prismaMock.spin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });

    it('uses the provided limit', async () => {
      prismaMock.spin.findMany.mockResolvedValue([]);

      await service.findRecent(25);

      expect(prismaMock.spin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 25 }),
      );
    });

    it('orders spins by spunAt descending', async () => {
      prismaMock.spin.findMany.mockResolvedValue([]);

      await service.findRecent(5);

      expect(prismaMock.spin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { spunAt: 'desc' } }),
      );
    });
  });

  describe('decide', () => {
    it('records the decision and notifies by email', async () => {
      prismaMock.spin.findUnique.mockResolvedValue({
        id: 'spin-1',
        outcome: 'PENDING',
      });
      prismaMock.spin.update.mockResolvedValue({
        id: 'spin-1',
        spunAt: new Date('2026-06-10T20:00:00.000Z'),
        outcome: 'ACCEPTED',
        decidedAt: new Date('2026-06-10T20:05:00.000Z'),
        datePlan: {
          id: 'plan-b',
          title: 'Mirar el atardecer',
          description: 'Buscar un lugar tranquilo.',
          emoji: '🌄',
          category: 'RELAX',
        },
      });

      const result = await service.decide('spin-1', SpinDecision.ACCEPTED);

      const [updateArg] = prismaMock.spin.update.mock.calls[0] as [
        { where: { id: string }; data: { outcome: string; decidedAt: Date } },
      ];
      expect(updateArg.where).toEqual({ id: 'spin-1' });
      expect(updateArg.data.outcome).toBe(SpinDecision.ACCEPTED);
      expect(updateArg.data.decidedAt).toBeInstanceOf(Date);
      expect(mailMock.sendSpinDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: SpinDecision.ACCEPTED,
          planTitle: 'Mirar el atardecer',
        }),
      );
      expect(result.outcome).toBe('ACCEPTED');
    });

    it('throws NotFoundException when the spin does not exist', async () => {
      prismaMock.spin.findUnique.mockResolvedValue(null);

      await expect(
        service.decide('missing', SpinDecision.ACCEPTED),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.spin.update).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the spin is already decided', async () => {
      prismaMock.spin.findUnique.mockResolvedValue({
        id: 'spin-1',
        outcome: 'ACCEPTED',
      });

      await expect(
        service.decide('spin-1', SpinDecision.REJECTED),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prismaMock.spin.update).not.toHaveBeenCalled();
    });
  });
});
