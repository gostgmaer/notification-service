'use strict';

const twilio = require('twilio');
const BaseProvider = require('./base.provider');

class TwilioProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'twilio';
    this.client = twilio(config.accountSid, config.authToken);
  }

  async send(payload) {
    try {
      const msg = await this.client.messages.create({
        from: payload.from || this.config.fromNumber,
        to: payload.to,
        body: payload.message,
      });
      return {
        success: true,
        providerMessageId: msg.sid,
        status: this.mapStatus(msg.status),
        cost: parseFloat(msg.price || 0) * -1,
        currency: msg.priceUnit || 'USD',
        rawResponse: msg,
      };
    } catch (err) {
      return {
        success: false, providerMessageId: null, status: 'FAILED',
        cost: 0, currency: 'USD', rawResponse: { error: err.message, code: err.code },
      };
    }
  }

  async getDeliveryStatus(providerMessageId) {
    try {
      const msg = await this.client.messages(providerMessageId).fetch();
      return { status: this.mapStatus(msg.status), rawResponse: msg };
    } catch (err) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  async getBalance() {
    try {
      const acct = await this.client.api.accounts(this.config.accountSid).fetch();
      return { balance: parseFloat(acct.balance || 0), currency: 'USD', rawResponse: acct };
    } catch (err) {
      return { balance: 0, currency: 'USD', rawResponse: { error: err.message } };
    }
  }

  mapStatus(s = '') {
    const map = {
      queued: 'QUEUED', sending: 'SENDING', sent: 'SENT',
      delivered: 'DELIVERED', undelivered: 'UNDELIVERED', failed: 'FAILED',
    };
    return map[s] || 'UNKNOWN';
  }

  validateWebhookSignature(headers, rawBody, url) {
    const sig = headers['x-twilio-signature'];
    if (!sig) return false;
    return twilio.validateRequest(this.config.authToken, sig, url || '', rawBody || {});
  }
}

module.exports = TwilioProvider;
