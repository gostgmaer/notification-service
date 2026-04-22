'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

class KaleyraProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'kaleyra';
    this.baseUrl = `https://api.kaleyra.io/v1/${config.sid}`;
  }

  _headers() {
    return { 'api-key': this.config.apiKey, 'Content-Type': 'application/json' };
  }

  async send(payload) {
    try {
      const body = {
        to: payload.to,
        type: 'sms',
        sender_id: payload.from || this.config.sender,
        body: payload.message,
      };
      const res = await axios.post(`${this.baseUrl}/messages`, body, {
        headers: this._headers(), timeout: 15000,
      });
      const data = res.data?.data;
      return {
        success: true,
        providerMessageId: data?.id || null,
        status: 'QUEUED',
        cost: 0,
        currency: 'INR',
        rawResponse: res.data,
      };
    } catch (err) {
      return {
        success: false, providerMessageId: null, status: 'FAILED',
        cost: 0, currency: 'INR', rawResponse: { error: err.response?.data || err.message },
      };
    }
  }

  async getDeliveryStatus() {
    return { status: 'UNKNOWN', rawResponse: { note: 'Kaleyra status via webhook DLR' } };
  }

  async getBalance() {
    try {
      const res = await axios.get(`${this.baseUrl}/account`, { headers: this._headers(), timeout: 10000 });
      return { balance: parseFloat(res.data?.data?.balance || 0), currency: 'INR', rawResponse: res.data };
    } catch (err) {
      return { balance: 0, currency: 'INR', rawResponse: { error: err.message } };
    }
  }

  mapStatus(s = '') {
    const map = { SENT: 'SENT', DELIVERED: 'DELIVERED', FAILED: 'FAILED', QUEUED: 'QUEUED' };
    return map[s.toUpperCase()] || 'UNKNOWN';
  }
}

module.exports = KaleyraProvider;
