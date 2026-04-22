import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SmsService } from '../services/sms.service';
import { SmsBulkService } from '../services/sms-bulk.service';

/**
 * Kafka consumer for SMS channel.
 * Registered only when ENABLE_KAFKA=true (via hybrid microservice in main.ts).
 */
@Controller()
export class SmsKafkaConsumer {
  private readonly logger = new Logger(SmsKafkaConsumer.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly bulkService: SmsBulkService,
  ) {}

  @MessagePattern(process.env.KAFKA_TOPIC_SMS_SEND || 'sms.notification.send')
  async handleSmsSend(@Payload() data: any): Promise<void> {
    this.logger.debug(`Kafka SMS send: to=${data?.payload?.to}`);
    try {
      await this.smsService.sendSms(data.payload, data.tenantId ?? null);
    } catch (err: any) {
      this.logger.error(`Kafka SMS send failed: ${err.message}`);
      throw err; // re-throw so Kafka can handle retries
    }
  }
}
