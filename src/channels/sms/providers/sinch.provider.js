'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

class SinchProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'sinch';
    this.region = config.region || 'us';
    this.baseUrl = `https://sms.api.sinch.com/xms/v1/${config.servicePlanId}`;
  }

  _headers() {
    return {
      Authorization: `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  async send(payload) {
    try {
      const body = {
        from: payload.from || this.config.fromNumber,
        to: [payload.to],
        body: payload.message,
      };
      const res = await axios.post(`${this.baseUrl}/batches`, body, {
        headers: this._headers(), timeout: 15000,
      });
      const data = res.data;
      return {
        success: true,
        providerMessageId: data?.id || null,
        status: this.mapStatus(data?.status),
        cost: 0,
        currency: 'USD',
        rawResponse: data,
      };
    } catch (err) {
      return {
        success: false, providerMessageId: null, status: 'FAILED',
        cost: 0, currency: 'USD', rawResponse: { error: err.response?.data || err.message },
      };
    }
  }

  async getDeliveryStatus(providerMessageId) {
    try {
      const res = await axios.get(`${this.baseUrl}/batches/${providerMessageId}`, {
        headers: this._headers(), timeout: 10000,
      });
      return { status: this.mapStatus(res.data?.status), rawResponse: res.data };
    } catch (err) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  async getBalance() {
    return { balance: 0, currency: 'USD', rawResponse: { note: 'Sinch balance not available via simple REST — check console' } };
  }

  mapStatus(s = '') {
    const map = {
      queued: 'QUEUED', sending: 'SENDING', sent: 'SENT',
      delivered: 'DELIVERED', failed: 'FAILED', unknown: 'UNKNOWN',
    };
    return map[s] || 'UNKNOWN';
  }
}

module.exports = SinchProvider;
