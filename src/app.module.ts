import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';

import configuration from './config/configuration';
import { DatabaseModule } from './shared/database/database.module';
import { RedisModule } from './shared/redis/redis.module';
import { AppCacheModule } from './shared/cache/cache.module';
import { TenantMiddleware } from './shared/tenant/tenant.middleware';
import { ApiKeyGuard } from './shared/auth/api-key.guard';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './shared/interceptors/timeout.interceptor';

import { SmsModule } from './channels/sms/sms.module';
import { EmailModule } from './channels/email/email.module';
import { HealthModule } from './health/health.module';

const BULL_ROOT_IMPORTS: any[] = [];
if (process.env.ENABLE_BULL === 'true') {
  BULL_ROOT_IMPORTS.push(
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('redis.url'),
        },
      }),
    }),
  );
}

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttle.ttl') * 1000,
            limit: config.get<number>('throttle.limit'),
          },
        ],
      }),
    }),

    // Infrastructure
    DatabaseModule,
    RedisModule,
    AppCacheModule,

    // BullMQ root (shared connection)
    ...BULL_ROOT_IMPORTS,

    // Feature modules
    SmsModule,
    EmailModule,
    HealthModule,
  ],
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: () => new TimeoutInterceptor(30_000),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
