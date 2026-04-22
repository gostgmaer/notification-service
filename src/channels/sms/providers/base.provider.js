'use strict';

/**
 * Base provider abstract class.
 * All providers must extend this and implement send(), getDeliveryStatus(), getBalance().
 */
class BaseProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
  }

  /**
   * Send an SMS message.
   * @param {Object} payload
   * @param {string} payload.to          - E.164 phone number
   * @param {string} payload.from        - Sender ID or number
   * @param {string} payload.message     - Message text
   * @param {string} payload.messageType - transactional | promotional | otp
   * @param {boolean} payload.unicode    - Whether message contains unicode chars
   * @param {Object} payload.metadata    - Any provider-specific extra fields
   * @returns {Promise<ProviderResponse>}
   *
   * ProviderResponse shape:
   * {
   *   success: Boolean,
   *   providerMessageId: String,
   *   status: 'SENT' | 'QUEUED' | 'FAILED',
   *   cost: Number,
   *   currency: String,
   *   rawResponse: Object
   * }
   */
  async send(payload) { // eslint-disable-line no-unused-vars
    throw new Error(`${this.name}.send() must be implemented`);
  }

  /**
   * Poll delivery status from the provider.
   * @param {string} providerMessageId
   * @returns {Promise<{ status: string, rawResponse: Object }>}
   */
  async getDeliveryStatus(providerMessageId) { // eslint-disable-line no-unused-vars
    throw new Error(`${this.name}.getDeliveryStatus() must be implemented`);
  }

  /**
   * Fetch account balance from the provider.
   * @returns {Promise<{ balance: number, currency: string, rawResponse: Object }>}
   */
  async getBalance() {
    throw new Error(`${this.name}.getBalance() must be implemented`);
  }

  /**
   * Validate an inbound DLR webhook signature.
   * @param {Object} headers
   * @param {Object|string} body
   * @returns {boolean}
   */
  validateWebhookSignature(headers, body) { // eslint-disable-line no-unused-vars
    // Default: no signature validation (override in providers that support it)
    return true;
  }

  /**
   * Map a provider DLR status string to internal status enum.
   * Override in each provider.
   * @param {string} providerStatus
   * @returns {string}
   */
  mapStatus(providerStatus) { // eslint-disable-line no-unused-vars
    return 'UNKNOWN';
  }
}

module.exports = BaseProvider;
