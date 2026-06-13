import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DecideSpinDto } from './dto/decide-spin.dto';
import { EmptySpinRequestDto } from './dto/empty-spin-request.dto';
import { RecentSpinsQueryDto } from './dto/recent-spins-query.dto';
import { RecentSpinsResponseDto, SpinResponseDto } from './dto/spin.dto';
import { SpinsService } from './spins.service';

@ApiTags('spins')
@Controller('spins')
export class SpinsController {
  constructor(private readonly spinsService: SpinsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Girar la ruleta y registrar el resultado' })
  @ApiCreatedResponse({ type: SpinResponseDto })
  @ApiConflictResponse({
    description: 'Existen menos de dos panoramas activos.',
  })
  async spin(@Body() _body: EmptySpinRequestDto): Promise<SpinResponseDto> {
    const result = await this.spinsService.spin();
    return { data: result };
  }

  @Patch(':id/decision')
  @ApiOperation({
    summary: 'Registrar si le gustó el panorama o si prefirió volver a girar',
  })
  @ApiOkResponse({ type: SpinResponseDto })
  @ApiNotFoundResponse({ description: 'El giro indicado no existe.' })
  @ApiConflictResponse({ description: 'El giro ya tiene una decisión.' })
  async decide(
    @Param('id') id: string,
    @Body() body: DecideSpinDto,
  ): Promise<SpinResponseDto> {
    const result = await this.spinsService.decide(id, body.outcome);
    return { data: result };
  }

  @Get('recent')
  @ApiOperation({ summary: 'Consultar los últimos giros' })
  @ApiOkResponse({ type: RecentSpinsResponseDto })
  async findRecent(
    @Query() query: RecentSpinsQueryDto,
  ): Promise<RecentSpinsResponseDto> {
    const spins = await this.spinsService.findRecent(query.limit);
    return { data: spins };
  }
}
