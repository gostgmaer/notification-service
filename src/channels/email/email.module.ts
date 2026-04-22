import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { EmailService } from './services/email.service';
import { EmailLogService } from './services/email-log.service';
import { EmailController } from './controllers/email.controller';
import { EmailKafkaProducer } from './kafka/email-kafka.producer';

// Conditional processor
const EMAIL_PROCESSOR_PROVIDERS: any[] = [];
if (process.env.ENABLE_BULL === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { EmailProcessor } = require('./queue/email.processor');
  EMAIL_PROCESSOR_PROVIDERS.push(EmailProcessor);
}

// Conditional Kafka consumer
const KAFKA_CONTROLLERS: any[] = [];
if (process.env.ENABLE_KAFKA === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { EmailKafkaConsumer } = require('./kafka/email-kafka.consumer');
  KAFKA_CONTROLLERS.push(EmailKafkaConsumer);
}

@Module({
  imports: [
    ConfigModule,
    ...(process.env.ENABLE_BULL === 'true'
      ? [
          BullModule.registerQueueAsync({
            name: 'email',
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              defaultJobOptions: {
                // Retry up to 3 times with exponential backoff (5s → 25s → 125s)
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                // Success: remove immediately — no need to keep completed jobs
                removeOnComplete: true,
                // Failure: keep for 30 days then auto-purge
                removeOnFail: { age: 30 * 24 * 60 * 60 },
              },
            }),
          }),
        ]
      : []),
  ],
  controllers: [EmailController, ...KAFKA_CONTROLLERS],
  providers: [EmailService, EmailLogService, EmailKafkaProducer, ...EMAIL_PROCESSOR_PROVIDERS],
  exports: [EmailService, EmailLogService],
})
export class EmailModule {}
