import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis | null => {
        const url = config.get<string>('redis.url');
        if (!url) return null;
        const client = new Redis(url, {
          password: config.get<string>('redis.password'),
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          lazyConnect: true,
        });
        client.on('error', (err) => {
          // Log but don't crash — Redis is optional
          console.warn('[Redis] connection error:', err.message);
        });
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
