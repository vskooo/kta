import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanCategory, SpinOutcome } from '../../generated/prisma/enums';

export class SelectedPlanDto {
  @ApiProperty({ example: 'cmbtq0abc0000abcd1234efgh' })
  id!: string;

  @ApiProperty({ example: 'Mirar el atardecer' })
  title!: string;

  @ApiPropertyOptional({
    example: 'Buscar un lugar tranquilo y ver caer el sol.',
  })
  description!: string | null;

  @ApiPropertyOptional({ example: '🌄' })
  emoji!: string | null;

  @ApiProperty({ enum: PlanCategory, example: PlanCategory.RELAX })
  category!: PlanCategory;
}

export class SpinResultDto {
  @ApiProperty({ example: 'cmbtq0xyz0000abcd5678ijkl' })
  id!: string;

  @ApiProperty({ example: '2026-06-10T20:00:00.000Z' })
  spunAt!: Date;

  @ApiProperty({ enum: SpinOutcome, example: SpinOutcome.PENDING })
  outcome!: SpinOutcome;

  @ApiProperty({ type: SelectedPlanDto })
  selectedPlan!: SelectedPlanDto;
}

export class SpinResponseDto {
  @ApiProperty({ type: SpinResultDto })
  data!: SpinResultDto;
}

export class RecentSpinDto {
  @ApiProperty({ example: 'cmbtq0xyz0000abcd5678ijkl' })
  id!: string;

  @ApiProperty({ example: '2026-06-10T20:00:00.000Z' })
  spunAt!: Date;

  @ApiProperty({ enum: SpinOutcome, example: SpinOutcome.ACCEPTED })
  outcome!: SpinOutcome;

  @ApiProperty({ type: SelectedPlanDto })
  selectedPlan!: SelectedPlanDto;
}

export class RecentSpinsResponseDto {
  @ApiProperty({ type: [RecentSpinDto] })
  data!: RecentSpinDto[];
}
