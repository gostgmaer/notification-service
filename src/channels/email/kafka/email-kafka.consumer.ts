import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmailService } from '../services/email.service';
import { EmailLogService } from '../services/email-log.service';

@Controller()
export class EmailKafkaConsumer {
  private readonly logger = new Logger(EmailKafkaConsumer.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly emailLogService: EmailLogService,
  ) {}

  @MessagePattern(process.env.KAFKA_TOPIC_EMAIL_SEND || 'email.notification.send')
  async handleEmailSend(@Payload() data: any): Promise<void> {
    this.logger.debug(`Kafka email send: to=${data?.payload?.to}`);
    const payload = data.payload || data;
    try {
      const result = await this.emailService.sendEmail(payload);
      if (payload.requestId) {
        await this.emailLogService.updateLog(payload.requestId, { status: 'sent', messageId: result.messageId, sentAt: new Date() });
      }
    } catch (err: any) {
      this.logger.error(`Kafka email send failed: ${err.message}`);
      if (payload.requestId) {
        await this.emailLogService.updateLog(payload.requestId, { status: 'failed', error: err.message, failedAt: new Date() });
      }
      throw err;
    }
  }
}
