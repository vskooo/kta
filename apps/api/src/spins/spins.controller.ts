import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
