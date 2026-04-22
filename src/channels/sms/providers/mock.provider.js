'use strict';

const { v4: uuidv4 } = require('uuid');
const BaseProvider = require('./base.provider');

class MockProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'mock';
    this.successRate = parseFloat(config.successRate ?? 0.95);
    this.dlrDelayMs = parseInt(config.dlrDelayMs ?? 2000, 10);
  }

  async send(payload) {
    await this._delay(50); // Simulate network latency
    const success = Math.random() < this.successRate;
    const providerMessageId = `mock_${uuidv4()}`;

    if (!success) {
      return {
        success: false,
        providerMessageId: null,
        status: 'FAILED',
        cost: 0,
        currency: 'USD',
        rawResponse: { mock: true, error: 'Simulated random failure' },
      };
    }

    return {
      success: true,
      providerMessageId,
      status: 'SENT',
      cost: 0,
      currency: 'USD',
      rawResponse: { mock: true, messageId: providerMessageId },
    };
  }

  async getDeliveryStatus(providerMessageId) {
    return {
      status: 'DELIVERED',
      rawResponse: { mock: true, providerMessageId },
    };
  }

  async getBalance() {
    return { balance: 999999, currency: 'USD', rawResponse: { mock: true } };
  }

  validateWebhookSignature() {
    return true;
  }

  mapStatus(providerStatus) {
    const map = {
      SENT: 'SENT', DELIVERED: 'DELIVERED', FAILED: 'FAILED', QUEUED: 'QUEUED',
    };
    return map[providerStatus] || 'UNKNOWN';
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = MockProvider;
