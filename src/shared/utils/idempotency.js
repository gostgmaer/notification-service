const logger = require('./logger');
const env = require('../../config/env');

/**
 * In-memory idempotency store
 * Optimized: unref'd timer, no dead Redis code
 */
class IdempotencyStore {
  constructor() {
    this.store = new Map();
    this.ttl = env.IDEMPOTENCY_TTL_MS;
    this.cleanupInterval = env.IDEMPOTENCY_CLEANUP_INTERVAL_MS;

    // unref() so the timer doesn't block process exit
    this._timer = setInterval(() => this.cleanup(), this.cleanupInterval);
    this._timer.unref();

    logger.info('Idempotency store initialized', {
      ttl: this.ttl,
      cleanupInterval: this.cleanupInterval
    });
  }

  /**
   * Check if key already exists (duplicate request)
   */
  async checkDuplicate(key) {
    if (!key) return false;

    const entry = this.store.get(key);
    if (!entry) return false;

    // Check if entry is expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    logger.debug('Duplicate idempotency key detected', { key });
    return true;
  }

  /**
   * Mark key as processed
   */
  async markAsProcessed(key) {
    if (!key) return;

    const now = Date.now();
    this.store.set(key, {
      processedAt: now,
      expiresAt: now + this.ttl
    });
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Idempotency store cleanup', {
        cleaned,
        remaining: this.store.size
      });
    }
  }

  /**
   * Get store stats
   */
  getStats() {
    return {
      totalKeys: this.store.size,
      ttl: this.ttl,
      cleanupInterval: this.cleanupInterval
    };
  }

  /**
   * Clear all keys (for testing)
   */
  clear() {
    this.store.clear();
  }
}

module.exports = new IdempotencyStore();

