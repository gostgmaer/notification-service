'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

const BASE = 'https://2factor.in/API/V1';

class TwoFactorProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = '2factor';
  }

  async send(payload) {
    // 2Factor is primarily for OTP. For custom SMS use the SMS endpoint.
    const phone = payload.to.replace(/^\+91/, '').replace(/\D/g, '');

    try {
      let url;
      if (payload.messageType === 'otp') {
        // Use OTP API — OTP value passed via metadata.otp
        const otp = payload.metadata?.otp || '000000';
        const template = this.config.otpTemplate ? `/${encodeURIComponent(this.config.otpTemplate)}` : '';
        url = `${BASE}/${this.config.apiKey}/SMS/${phone}/${otp}${template}`;
      } else {
        // Custom transactional SMS
        url = `${BASE}/${this.config.apiKey}/SMS/${phone}/AUTOGEN3/${encodeURIComponent(payload.message)}`;
      }

      const res = await axios.get(url, { timeout: 10000 });
      const data = res.data;

      if (data.Status === 'Success') {
        return {
          success: true,
          providerMessageId: data.Details,
          status: 'SENT',
          cost: 0,
          currency: 'INR',
          rawResponse: data,
        };
      }
      return {
        success: false,
        providerMessageId: null,
        status: 'FAILED',
        cost: 0,
        currency: 'INR',
        rawResponse: data,
      };
    } catch (err) {
      return {
        success: false,
        providerMessageId: null,
        status: 'FAILED',
        cost: 0,
        currency: 'INR',
        rawResponse: { error: err.message },
      };
    }
  }

  async getDeliveryStatus(providerMessageId) {
    try {
      const url = `${BASE}/${this.config.apiKey}/SMS/VERIFY/${providerMessageId}/AUTOGEN`;
      const res = await axios.get(url, { timeout: 10000 });
      return { status: 'UNKNOWN', rawResponse: res.data };
    } catch (err) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  async getBalance() {
    return { balance: 0, currency: 'INR', rawResponse: { note: '2Factor free OTP credits — no balance API' } };
  }

  mapStatus(s) {
    if (s === 'Success') return 'SENT';
    return 'FAILED';
  }
}

module.exports = TwoFactorProvider;
