import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { SmsLog, SmsLogSchema } from './schemas/sms-log.schema';
import { SmsProvidersService } from './config/sms-providers.service';
import { SmsService } from './services/sms.service';
import { SmsBulkService } from './services/sms-bulk.service';
import { SmsAnalyticsService } from './services/sms-analytics.service';
import { SmsWebhookService } from './services/sms-webhook.service';
import { SmsRetryService } from './services/sms-retry.service';
import { SmsTemplateService } from './services/sms-template.service';
import { SmsController } from './controllers/sms.controller';
import { SmsAnalyticsController } from './controllers/sms-analytics.controller';
import { SmsTemplateController } from './controllers/sms-template.controller';
import { SmsWebhookController } from './controllers/sms-webhook.controller';
import { SmsKafkaConsumer } from './kafka/sms-kafka.consumer';
import { SmsKafkaProducer } from './kafka/sms-kafka.producer';

// Conditionally import processor
const SMS_PROCESSOR_PROVIDERS: any[] = [];
if (process.env.ENABLE_BULL === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SmsProcessor } = require('./queue/sms.processor');
  SMS_PROCESSOR_PROVIDERS.push(SmsProcessor);
}

// Conditionally include Kafka consumer
const KAFKA_PROVIDERS: any[] = [];
if (process.env.ENABLE_KAFKA === 'true') {
  KAFKA_PROVIDERS.push(SmsKafkaConsumer);
}

// Register legacy JS Mongoose models into NestJS connection
function registerLegacyModels() {
  const modelsDir = path.join(__dirname, 'models');
  // The JS models call mongoose.model() on require — force registration
  try {
    require('./models/OtpStore');
    require('./models/SmsCampaign');
    require('./models/SmsTemplate');
  } catch {
    // Already registered in Mongoose — no-op
  }
}

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: SmsLog.name, schema: SmsLogSchema }]),
    // BullMQ queue — registered only when ENABLE_BULL=true
    ...(process.env.ENABLE_BULL === 'true'
      ? [
          BullModule.registerQueueAsync({
            name: 'sms',
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              defaultJobOptions: {
                // Retry up to 3 times with exponential backoff (5s → 25s → 125s)
                attempts: config.get<number>('sms.retryAttempts') ?? 3,
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
  controllers: [
    SmsController,
    SmsAnalyticsController,
    SmsTemplateController,
    SmsWebhookController,
    ...KAFKA_PROVIDERS,
  ],
  providers: [
    SmsProvidersService,
    SmsService,
    SmsBulkService,
    SmsAnalyticsService,
    SmsWebhookService,
    SmsRetryService,
    SmsTemplateService,
    SmsKafkaProducer,
    ...SMS_PROCESSOR_PROVIDERS,
    // Legacy model registration side-effect
    {
      provide: 'SMS_LEGACY_MODELS',
      useFactory: () => { registerLegacyModels(); return true; },
    },
  ],
  exports: [SmsService, SmsBulkService, SmsAnalyticsService],
})
export class SmsModule {}
