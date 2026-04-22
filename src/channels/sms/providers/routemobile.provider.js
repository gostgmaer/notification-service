'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

const BASE = 'http://www.routemobile.com/api';

class RouteMobileProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'routemobile';
  }

  async send(payload) {
    try {
      const body = {
        username: this.config.username,
        password: this.config.password,
        source: payload.from || this.config.source,
        destination: payload.to.replace(/^\+/, ''),
        message: payload.message,
        type: payload.unicode ? '2' : '0',
        dlr: '1',
        dlrurl: payload.metadata?.dlrUrl || '',
      };
      const res = await axios.post(`${BASE}/sendmsg.php`, new URLSearchParams(body), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      });
      const msgId = res.data?.toString().trim();
      const ok = msgId && !msgId.includes('ERROR');
      return {
        success: !!ok,
        providerMessageId: ok ? msgId : null,
        status: ok ? 'SENT' : 'FAILED',
        cost: 0,
        currency: 'INR',
        rawResponse: { response: res.data },
      };
    } catch (err) {
      return {
        success: false, providerMessageId: null, status: 'FAILED',
        cost: 0, currency: 'INR', rawResponse: { error: err.message },
      };
    }
  }

  async getDeliveryStatus() {
    return { status: 'UNKNOWN', rawResponse: { note: 'Route Mobile DLR via webhook only' } };
  }

  async getBalance() {
    return { balance: 0, currency: 'INR', rawResponse: { note: 'Route Mobile balance via dashboard' } };
  }

  mapStatus(s = '') {
    if (s === 'DELIVERED') return 'DELIVERED';
    if (s === 'SENT') return 'SENT';
    if (s === 'FAILED') return 'FAILED';
    return 'UNKNOWN';
  }
}

module.exports = RouteMobileProvider;
