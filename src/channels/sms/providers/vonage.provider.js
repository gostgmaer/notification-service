'use strict';

const axios = require('axios');
const crypto = require('crypto');
const BaseProvider = require('./base.provider');

class VonageProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'vonage';
  }

  async send(payload) {
    try {
      const params = new URLSearchParams({
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
        to: payload.to.replace(/^\+/, ''),
        from: payload.from || this.config.from,
        text: payload.message,
        type: payload.unicode ? 'unicode' : 'text',
      });

      const res = await axios.post('https://rest.nexmo.com/sms/json', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      });

      const message = res.data?.messages?.[0];
      const success = message?.status === '0';
      return {
        success,
        providerMessageId: message?.['message-id'] || null,
        status: success ? 'SENT' : 'FAILED',
        cost: parseFloat(message?.['message-price'] || 0),
        currency: 'EUR',
        rawResponse: res.data,
      };
    } catch (err) {
      return {
        success: false,
        providerMessageId: null,
        status: 'FAILED',
        cost: 0,
        currency: 'EUR',
        rawResponse: { error: err.response?.data || err.message },
      };
    }
  }

  async getDeliveryStatus() {
    return { status: 'UNKNOWN', rawResponse: { note: 'Vonage delivery status via webhook DLR only' } };
  }

  async getBalance() {
    try {
      const res = await axios.get(
        `https://rest.nexmo.com/account/get-balance?api_key=${this.config.apiKey}&api_secret=${this.config.apiSecret}`,
        { timeout: 10000 }
      );
      return { balance: parseFloat(res.data?.value || 0), currency: 'EUR', rawResponse: res.data };
    } catch (err) {
      return { balance: 0, currency: 'EUR', rawResponse: { error: err.message } };
    }
  }

  mapStatus(s = '') {
    const map = {
      accepted: 'QUEUED', delivered: 'DELIVERED', buffered: 'SENDING',
      expired: 'FAILED', failed: 'FAILED', rejected: 'REJECTED',
    };
    return map[s] || 'UNKNOWN';
  }

  validateWebhookSignature(headers, rawBody) {
    const sig = headers['x-nexmo-signature'] || headers['x-vonage-signature'];
    if (!sig || !this.config.apiSecret) return true; // Skip if not configured
    const expected = crypto.createHmac('sha256', this.config.apiSecret)
      .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  }
}

module.exports = VonageProvider;
