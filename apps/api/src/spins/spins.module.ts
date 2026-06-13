import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { SpinsController } from './spins.controller';
import { SpinsService } from './spins.service';

@Module({
  imports: [MailModule],
  controllers: [SpinsController],
  providers: [SpinsService],
})
export class SpinsModule {}
