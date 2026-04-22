'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

const BASE = 'https://www.smscountry.com/smscountryapi.aspx';

class SmsCountryProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'smscountry';
  }

  async send(payload) {
    try {
      const params = new URLSearchParams({
        User: this.config.username,
        passwd: this.config.password,
        mobileno: payload.to.replace(/^\+/, ''),
        message: payload.message,
        sid: payload.from || this.config.senderId,
        mtype: payload.messageType === 'PROMOTIONAL' ? 'N' : 'N',
        DR: 'Y',
      });
      const res = await axios.get(`${BASE}?${params.toString()}`, { timeout: 15000 });
      const raw = res.data?.toString().trim();
      // Response like "OK MSGID" or "ERROR ..."
      const ok = raw.startsWith('OK') || raw.startsWith('ok');
      const msgId = ok ? raw.split(' ')[1] : null;
      return {
        success: !!ok,
        providerMessageId: msgId || null,
        status: ok ? 'SENT' : 'FAILED',
        cost: 0,
        currency: 'INR',
        rawResponse: { response: raw },
      };
    } catch (err) {
      return {
        success: false, providerMessageId: null, status: 'FAILED',
        cost: 0, currency: 'INR', rawResponse: { error: err.message },
      };
    }
  }

  async getDeliveryStatus() {
    return { status: 'UNKNOWN', rawResponse: { note: 'SMSCountry DLR via webhook only' } };
  }

  async getBalance() {
    return { balance: 0, currency: 'INR', rawResponse: {} };
  }

  mapStatus(s = '') {
    if (s === 'DELIVERED') return 'DELIVERED';
    if (s === 'SENT') return 'SENT';
    if (s === 'FAILED') return 'FAILED';
    return 'UNKNOWN';
  }
}

module.exports = SmsCountryProvider;
