'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

const BASE = 'https://enterprise.smsgupshup.com';

class GupshupProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'gupshup';
  }

  async send(payload) {
    try {
      const params = new URLSearchParams({
        userid: this.config.userId,
        password: this.config.password,
        send_to: payload.to.replace(/^\+91/, '').replace(/\D/g, ''),
        msg: payload.message,
        msg_type: this.config.msgType || 'TEXT',
        method: this.config.sendMethod || 'simpleMessage',
        format: 'json',
        v: '1.1',
      });
      const res = await axios.post(`${BASE}/GatewayAPI/rest`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      });
      const data = res.data;
      const ok = data?.response?.status === 'success' || data?.response?.id;
      return {
        success: !!ok,
        providerMessageId: String(data?.response?.id || ''),
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
    return { status: 'UNKNOWN', rawResponse: { note: 'Gupshup status via webhook DLR only' } };
  }

  async getBalance() {
    return { balance: 0, currency: 'INR', rawResponse: { note: 'Check Gupshup dashboard for balance' } };
  }

  mapStatus(s = '') {
    if (s === 'success') return 'SENT';
    if (s === 'DELIVERED') return 'DELIVERED';
    return 'UNKNOWN';
  }
}

module.exports = GupshupProvider;
