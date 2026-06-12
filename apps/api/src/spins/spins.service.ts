import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RecentSpinDto, SpinResultDto } from './dto/spin.dto';

interface WeightedPlan {
  id: string;
  weight: number;
}

const MIN_ACTIVE_PLANS = 2;
const MIN_WEIGHT = 1;
const MAX_WEIGHT = 100;

const SELECTED_PLAN_SELECT = {
  id: true,
  title: true,
  description: true,
  emoji: true,
  category: true,
} as const;

@Injectable()
export class SpinsService {
  private readonly logger = new Logger(SpinsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async spin(): Promise<SpinResultDto> {
    const plans = await this.prisma.datePlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, weight: true },
    });

    if (plans.length < MIN_ACTIVE_PLANS) {
      throw new ConflictException(
        'Se necesitan al menos dos panoramas activos para girar la ruleta.',
      );
    }

    const selected = this.pickWeighted(plans);

    const spin = await this.prisma.spin.create({
      data: { datePlanId: selected.id },
      select: {
        id: true,
        spunAt: true,
        datePlan: { select: SELECTED_PLAN_SELECT },
      },
    });

    return {
      id: spin.id,
      spunAt: spin.spunAt,
      selectedPlan: spin.datePlan,
    };
  }

  async findRecent(limit?: number): Promise<RecentSpinDto[]> {
    const defaultLimit = this.configService.get<number>(
      'RECENT_SPINS_DEFAULT_LIMIT',
      10,
    );

    const spins = await this.prisma.spin.findMany({
      take: limit ?? defaultLimit,
      orderBy: { spunAt: 'desc' },
      select: {
        id: true,
        spunAt: true,
        datePlan: { select: SELECTED_PLAN_SELECT },
      },
    });

    return spins.map((spin) => ({
      id: spin.id,
      spunAt: spin.spunAt,
      selectedPlan: spin.datePlan,
    }));
  }

  pickWeighted<T extends WeightedPlan>(plans: T[]): T {
    this.validateWeights(plans);

    const totalWeight = plans.reduce((sum, plan) => sum + plan.weight, 0);
    const value = randomInt(totalWeight);

    let accumulated = 0;

    for (const plan of plans) {
      accumulated += plan.weight;

      if (value < accumulated) {
        return plan;
      }
    }

    throw new InternalServerErrorException(
      'No se pudo seleccionar un panorama.',
    );
  }

  private validateWeights(plans: WeightedPlan[]): void {
    const invalid = plans.find(
      (plan) =>
        !Number.isInteger(plan.weight) ||
        plan.weight < MIN_WEIGHT ||
        plan.weight > MAX_WEIGHT,
    );

    if (invalid) {
      this.logger.error(
        `Plan ${invalid.id} has an invalid weight: ${invalid.weight}`,
      );
      throw new InternalServerErrorException(
        'No se pudo seleccionar un panorama.',
      );
    }
  }
}
