import 'reflect-metadata';
// Load .env BEFORE any module-level code runs (e.g. BullModule conditional imports).
// NestJS's ConfigModule.forRoot() loads .env only at bootstrap time — too late for
// top-level `if (process.env.X === 'true')` guards in module files.
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const helmet = require('helmet');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const enableKafka = process.env.ENABLE_KAFKA === 'true';

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-tenant-id', 'x-app', 'x-app-url', 'x-path'],
  });

  // ── Global pipes ──────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Kafka hybrid microservice (conditional) ──────────────────────────────
  if (enableKafka) {
    const kafkaOptions: MicroserviceOptions = {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
          brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        },
        consumer: {
          groupId: process.env.KAFKA_GROUP_ID || 'notification-service',
        },
      },
    };
    app.connectMicroservice<MicroserviceOptions>(kafkaOptions);
    await app.startAllMicroservices();
    logger.log('Kafka microservice started');
  }

  const port = parseInt(process.env.PORT, 10) || 4000;

  // ── Swagger / OpenAPI ────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Notification Service')
      .setDescription(
        'Unified SMS + Email notification service. ' +
        'Authenticate using an API key — pass it as `Authorization: Bearer <key>` or `x-api-key: <key>` header.',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'API Key' }, 'api-key')
      .addTag('SMS', 'Send, track and manage SMS messages')
      .addTag('SMS Analytics', 'Delivery stats and provider health')
      .addTag('SMS Templates', 'CRUD for reusable SMS templates')
      .addTag('Webhooks', 'Inbound delivery status callbacks from SMS providers')
      .addTag('Email', 'Send and track email messages')
      .addTag('Health', 'Liveness and readiness probes')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
    logger.log(`Swagger UI available at http://localhost:${port}/docs`);
  }

  await app.listen(port);

  logger.log(`Notification Service running on port ${port}`);
  logger.log(`Bull workers: ${process.env.ENABLE_BULL === 'true' ? 'ENABLED' : 'disabled'}`);
  logger.log(`Kafka consumers: ${enableKafka ? 'ENABLED' : 'disabled'}`);
  logger.log(`Redis cache: ${process.env.ENABLE_CACHE === 'true' ? 'ENABLED' : 'disabled'}`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});

