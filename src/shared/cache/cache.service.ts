import { Injectable, Inject, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(
    @Optional() @Inject(CACHE_MANAGER) private readonly cache: Cache | null,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    if (!this.cache) return null;
    try {
      return await this.cache.get<T>(key) ?? null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.set(key, value, ttlSeconds ? ttlSeconds * 1000 : undefined);
    } catch {
      // Graceful degradation
    }
  }

  async del(key: string): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.del(key);
    } catch {}
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await fn();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}
