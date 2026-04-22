'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

const BASE = 'https://api.jiocx.com/v1';

class JioCXProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'jiocx';
  }

  _headers() {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'X-Account-Id': this.config.accountId,
    };
  }

  async send(payload) {
    try {
      const body = {
        to: payload.to,
        from: payload.from || this.config.senderId,
        message: payload.message,
        type: payload.messageType || 'transactional',
        ...(payload.metadata?.dltTemplateId && { template_id: payload.metadata.dltTemplateId }),
      };
      const res = await axios.post(`${BASE}/sms/send`, body, {
        headers: this._headers(), timeout: 15000,
      });
      const data = res.data;
      const ok = data?.status === 'SUBMITTED' || data?.message_id;
      return {
        success: !!ok,
        providerMessageId: data?.message_id || null,
        status: ok ? 'SENT' : 'FAILED',
        cost: 0,
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
    return { status: 'UNKNOWN', rawResponse: { note: 'JioCX DLR via webhook' } };
  }

  async getBalance() {
    return { balance: 0, currency: 'INR', rawResponse: { note: 'JioCX balance via enterprise portal' } };
  }

  mapStatus(s = '') {
    const map = { SUBMITTED: 'SENT', DELIVERED: 'DELIVERED', FAILED: 'FAILED' };
    return map[s.toUpperCase()] || 'UNKNOWN';
  }
}

module.exports = JioCXProvider;
