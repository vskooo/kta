import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanCategory } from '../../generated/prisma/enums';

export class PlanDto {
  @ApiProperty({ example: 'cmbtq0abc0000abcd1234efgh' })
  id!: string;

  @ApiProperty({ example: 'Picnic con vista', maxLength: 80 })
  title!: string;

  @ApiPropertyOptional({
    example: 'Preparar algo rico y buscar un lugar bonito para conversar.',
    maxLength: 240,
  })
  description!: string | null;

  @ApiPropertyOptional({ example: '🧺', maxLength: 16 })
  emoji!: string | null;

  @ApiProperty({ enum: PlanCategory, example: PlanCategory.ADVENTURE })
  category!: PlanCategory;

  @ApiProperty({ example: 1, minimum: 1, maximum: 100 })
  weight!: number;
}

export class PlansResponseDto {
  @ApiProperty({ type: [PlanDto] })
  data!: PlanDto[];
}
