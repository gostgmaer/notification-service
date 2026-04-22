'use strict';

const plivo = require('plivo');
const crypto = require('crypto');
const BaseProvider = require('./base.provider');

class PlivoProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'plivo';
    this.client = new plivo.Client(config.authId, config.authToken);
  }

  async send(payload) {
    try {
      const res = await this.client.messages.create(
        payload.from || this.config.fromNumber,
        payload.to,
        payload.message
      );
      return {
        success: true,
        providerMessageId: res.messageUuid?.[0] || res.message_uuid,
        status: 'QUEUED',
        cost: 0,
        currency: 'USD',
        rawResponse: res,
      };
    } catch (err) {
      return {
        success: false, providerMessageId: null, status: 'FAILED',
        cost: 0, currency: 'USD', rawResponse: { error: err.message },
      };
    }
  }

  async getDeliveryStatus(providerMessageId) {
    try {
      const res = await this.client.messages.get(providerMessageId);
      return { status: this.mapStatus(res.message_state), rawResponse: res };
    } catch (err) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  async getBalance() {
    try {
      const res = await this.client.accounts.get();
      return { balance: parseFloat(res.cash_credits || 0), currency: 'USD', rawResponse: res };
    } catch (err) {
      return { balance: 0, currency: 'USD', rawResponse: { error: err.message } };
    }
  }

  mapStatus(s = '') {
    const map = {
      sent: 'SENT', delivered: 'DELIVERED', undelivered: 'UNDELIVERED',
      failed: 'FAILED', queued: 'QUEUED',
    };
    return map[s.toLowerCase()] || 'UNKNOWN';
  }

  validateWebhookSignature(headers, rawBody) {
    const sig = headers['x-plivo-signature-v2'] || headers['x-plivo-signature'];
    if (!sig) return false;
    const expected = crypto.createHmac('sha1', this.config.authToken)
      .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
      .digest('base64');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  }
}

module.exports = PlivoProvider;
