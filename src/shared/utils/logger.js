'use strict';
/**
 * Simple logger shim for shared JS utilities.
 * Uses console when Winston isn't available in the current scope.
 */
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => console.debug('[DEBUG]', ...args),
};
module.exports = logger;
