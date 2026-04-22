import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const enabled = config.get<boolean>('cache.enabled');
        const redisUrl = config.get<string>('redis.url');

        if (enabled && redisUrl) {
          const { redisInsStore } = await import('cache-manager-ioredis-yet');
          const Redis = (await import('ioredis')).default;
          const redisClient = new Redis(redisUrl);
          return {
            store: await redisInsStore(redisClient),
            ttl: 300,
          };
        }
        // In-memory fallback
        return { ttl: 300 };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class AppCacheModule {}
