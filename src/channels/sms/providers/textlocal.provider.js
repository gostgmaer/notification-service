'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

class TextLocalProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'textlocal';
  }

  async send(payload) {
    try {
      const to = payload.to.replace(/^\+91/, '91').replace(/\D/g, '');
      const params = new URLSearchParams({
        apikey: this.config.apiKey,
        numbers: to,
        message: payload.message,
        sender: payload.from || this.config.sender,
      });
      const res = await axios.post('https://api.textlocal.in/send/', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      });
      const data = res.data;
      const ok = data?.status === 'success';
      return {
        success: ok,
        providerMessageId: String(data?.messages?.[0]?.id || ''),
        status: ok ? 'SENT' : 'FAILED',
        cost: parseFloat(data?.cost || data?.num_credits || 0),
        currency: 'INR',
        rawResponse: data,
      };
    } catch (err) {
      return {
        success: false, providerMessageId: null, status: 'FAILED',
        cost: 0, currency: 'INR', rawResponse: { error: err.response?.data || err.message },
      };
    }
  }

  async getDeliveryStatus() {
    return { status: 'UNKNOWN', rawResponse: { note: 'TextLocal delivery status via webhook DLR' } };
  }

  async getBalance() {
    try {
      const params = new URLSearchParams({ apikey: this.config.apiKey });
      const res = await axios.post('https://api.textlocal.in/balance/', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000,
      });
      return { balance: parseFloat(res.data?.balance?.sms || 0), currency: 'credits', rawResponse: res.data };
    } catch (err) {
      return { balance: 0, currency: 'credits', rawResponse: { error: err.message } };
    }
  }

  mapStatus(s = '') {
    if (s === 'OK' || s === 'success') return 'SENT';
    if (s === 'delivrd') return 'DELIVERED';
    return 'FAILED';
  }

  validateWebhookSignature() {
    return true; // TextLocal does not sign DLR callbacks
  }
}

module.exports = TextLocalProvider;
