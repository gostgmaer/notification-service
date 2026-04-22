'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

const BASE = 'https://api.d7networks.com/messages/v1';

class D7NetworksProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'd7networks';
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
        messages: [{
          channel: 'sms',
          recipients: [payload.to],
          content: payload.message,
          msg_type: payload.unicode ? 'unicode' : 'text',
          data_coding: payload.unicode ? 'unicode' : 'text',
          originator: payload.from || this.config.senderId,
        }],
        message_globals: {
          preferred_route: 'economy',
        },
      };
      const res = await axios.post(`${BASE}/send`, body, {
        headers: this._headers(), timeout: 15000,
      });
      const data = res.data?.request_id;
      return {
        success: true,
        providerMessageId: String(data || ''),
        status: 'QUEUED',
        cost: 0,
        currency: 'USD',
        rawResponse: res.data,
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
      const res = await axios.get(`${BASE}/report/${providerMessageId}`, {
        headers: this._headers(), timeout: 10000,
      });
      const status = this.mapStatus(res.data?.status);
      return { status, rawResponse: res.data };
    } catch (err) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  async getBalance() {
    try {
      const res = await axios.get('https://api.d7networks.com/accounts/v1/balance', {
        headers: this._headers(), timeout: 10000,
      });
      return { balance: parseFloat(res.data?.balance || 0), currency: 'USD', rawResponse: res.data };
    } catch (err) {
      return { balance: 0, currency: 'USD', rawResponse: { error: err.message } };
    }
  }

  mapStatus(s = '') {
    const map = { queued: 'QUEUED', sent: 'SENT', delivered: 'DELIVERED', failed: 'FAILED' };
    return map[s.toLowerCase()] || 'UNKNOWN';
  }
}

module.exports = D7NetworksProvider;
