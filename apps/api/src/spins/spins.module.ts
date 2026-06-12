import { Module } from '@nestjs/common';
import { SpinsController } from './spins.controller';
import { SpinsService } from './spins.service';

@Module({
  controllers: [SpinsController],
  providers: [SpinsService],
})
export class SpinsModule {}
