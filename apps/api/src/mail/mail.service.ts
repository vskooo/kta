import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { SpinOutcome } from '../generated/prisma/enums';

export interface SpinDecisionMail {
  outcome: Extract<SpinOutcome, 'ACCEPTED' | 'REJECTED'>;
  planTitle: string;
  planDescription: string | null;
  planEmoji: string | null;
  decidedAt: Date;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP no está configurado; las notificaciones por correo quedarán deshabilitadas.',
      );
      return;
    }

    const port = Number(this.configService.get<number>('SMTP_PORT', 587));
    const secureRaw = this.configService.get<string | boolean>('SMTP_SECURE');
    const secure =
      secureRaw === undefined
        ? port === 465
        : secureRaw === true || secureRaw === 'true';

    this.transporter = createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  async sendSpinDecision(payload: SpinDecisionMail): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `Notificación omitida (SMTP deshabilitado): ${payload.outcome} -> ${payload.planTitle}`,
      );
      return;
    }

    const from = this.configService.get<string>(
      'MAIL_FROM',
      this.configService.getOrThrow<string>('SMTP_USER'),
    );
    const to = this.configService.getOrThrow<string>('MAIL_TO');

    const { subject, html, text } = this.buildContent(payload);

    try {
      await this.transporter.sendMail({ from, to, subject, html, text });
      this.logger.log(
        `Notificación enviada (${payload.outcome}): ${payload.planTitle}`,
      );
    } catch (error) {
      this.logger.error(
        `No se pudo enviar la notificación de correo: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private buildContent(payload: SpinDecisionMail): {
    subject: string;
    text: string;
    html: string;
  } {
    const emoji = payload.planEmoji ?? '✨';
    const when = payload.decidedAt.toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
    });
    const description = payload.planDescription ?? 'Sin descripción.';

    if (payload.outcome === 'ACCEPTED') {
      const subject = `💖 Catita eligió: ${payload.planTitle}`;
      const text = `Catita giró la ruleta y le encantó este panorama.\n\nPanorama: ${emoji} ${payload.planTitle}\nDescripción: ${description}\nCuándo: ${when}`;
      const html = `
        <h2>💖 ¡Catita eligió un panorama!</h2>
        <p>Giró la ruleta y le encantó este resultado.</p>
        <ul>
          <li><strong>Panorama:</strong> ${emoji} ${this.escape(payload.planTitle)}</li>
          <li><strong>Descripción:</strong> ${this.escape(description)}</li>
          <li><strong>Cuándo:</strong> ${this.escape(when)}</li>
        </ul>`;
      return { subject, text, html };
    }

    const subject = `🔄 Catita rechazó: ${payload.planTitle}`;
    const text = `Catita giró la ruleta y prefirió volver a girar. Considera desactivar este panorama.\n\nPanorama: ${emoji} ${payload.planTitle}\nDescripción: ${description}\nCuándo: ${when}`;
    const html = `
      <h2>🔄 Catita prefirió volver a girar</h2>
      <p>Este panorama no la convenció. Quizás quieras desactivarlo para poner otro.</p>
      <ul>
        <li><strong>Panorama:</strong> ${emoji} ${this.escape(payload.planTitle)}</li>
        <li><strong>Descripción:</strong> ${this.escape(description)}</li>
        <li><strong>Cuándo:</strong> ${this.escape(when)}</li>
      </ul>`;
    return { subject, text, html };
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
