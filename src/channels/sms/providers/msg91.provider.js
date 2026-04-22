'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

const BASE = 'https://control.msg91.com/api/v5';

class MSG91Provider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'msg91';
  }

  _headers() {
    return { authkey: this.config.authKey, 'Content-Type': 'application/json' };
  }

  async send(payload) {
    try {
      // OTP route
      if (payload.messageType === 'otp') {
        const phone = payload.to.replace(/^\+/, '');
        const body = {
          mobile: phone,
          authkey: this.config.authKey,
          message: payload.message,
          sender: payload.from || this.config.senderId,
          otp: payload.metadata?.otp,
          ...(this.config.dltTeId && { template_id: this.config.dltTeId }),
        };
        const res = await axios.post(`${BASE}/otp`, body, { timeout: 15000 });
        const ok = res.data?.type === 'success';
        return {
          success: ok,
          providerMessageId: res.data?.request_id || null,
          status: ok ? 'SENT' : 'FAILED',
          cost: 0,
          currency: 'INR',
          rawResponse: res.data,
        };
      }

      // Transactional / promotional
      const body = {
        sender: payload.from || this.config.senderId,
        route: this.config.route || '4',
        country: '91',
        sms: [{
          message: payload.message,
          to: [payload.to.replace(/^\+91/, '').replace(/\D/g, '')],
        }],
        ...(this.config.dltTeId && { DLT_TE_ID: this.config.dltTeId }),
      };
      const res = await axios.post(`${BASE}/flow/`, body, {
        headers: this._headers(), timeout: 15000,
      });

      const ok = res.data?.type === 'success';
      return {
        success: ok,
        providerMessageId: res.data?.request_id || null,
        status: ok ? 'SENT' : 'FAILED',
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

  async getDeliveryStatus(providerMessageId) {
    try {
      const res = await axios.get(
        `https://api.msg91.com/api/v2/report?request_id=${providerMessageId}&authkey=${this.config.authKey}`,
        { timeout: 10000 }
      );
      const status = this.mapStatus(String(res.data?.data?.[0]?.status || ''));
      return { status, rawResponse: res.data };
    } catch (err) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  async getBalance() {
    try {
      const res = await axios.get(
        `https://control.msg91.com/api/balance.php?authkey=${this.config.authKey}&type=1`,
        { timeout: 10000 }
      );
      return { balance: parseFloat(res.data?.balance || 0), currency: 'INR', rawResponse: res.data };
    } catch (err) {
      return { balance: 0, currency: 'INR', rawResponse: { error: err.message } };
    }
  }

  mapStatus(s = '') {
    if (s === '1') return 'DELIVERED';
    if (s === '2') return 'SENT';
    if (s === '3') return 'FAILED';
    if (s === '9') return 'REJECTED'; // NDNC
    return 'UNKNOWN';
  }
}

module.exports = MSG91Provider;
