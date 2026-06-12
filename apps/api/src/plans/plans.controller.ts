import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlansResponseDto } from './dto/plan.dto';
import { PlansService } from './plans.service';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'Listar panoramas activos' })
  @ApiOkResponse({ type: PlansResponseDto })
  async findActive(): Promise<PlansResponseDto> {
    const plans = await this.plansService.findActivePlans();
    return { data: plans };
  }
}
