import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum SpinDecision {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class DecideSpinDto {
  @ApiProperty({
    enum: SpinDecision,
    description:
      'ACCEPTED si le gustó el panorama, REJECTED si prefirió volver a girar.',
    example: SpinDecision.ACCEPTED,
  })
  @IsEnum(SpinDecision)
  outcome!: SpinDecision;
}
