'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

class ExotelProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'exotel';
    this._auth = Buffer.from(`${config.apiKey}:${config.apiToken}`).toString('base64');
    this.baseUrl = `https://api.exotel.com/v1/Accounts/${config.sid}`;
  }

  _headers() {
    return { Authorization: `Basic ${this._auth}`, 'Content-Type': 'application/x-www-form-urlencoded' };
  }

  async send(payload) {
    try {
      const params = new URLSearchParams({
        From: payload.from || this.config.senderId,
        To: payload.to,
        Body: payload.message,
      });
      const res = await axios.post(`${this.baseUrl}/Sms/send.json`, params, {
        headers: this._headers(), timeout: 15000,
      });
      const data = res.data?.SMSMessage;
      return {
        success: !!data?.Sid,
        providerMessageId: data?.Sid || null,
        status: this.mapStatus(data?.Status),
        cost: parseFloat(data?.Price || 0),
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
      const res = await axios.get(`${this.baseUrl}/Sms/${providerMessageId}.json`, {
        headers: this._headers(), timeout: 10000,
      });
      return { status: this.mapStatus(res.data?.SMSMessage?.Status), rawResponse: res.data };
    } catch (err) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  async getBalance() {
    return { balance: 0, currency: 'INR', rawResponse: { note: 'Exotel balance via dashboard' } };
  }

  mapStatus(s = '') {
    const map = { queued: 'QUEUED', sent: 'SENT', failed: 'FAILED', unknown: 'UNKNOWN' };
    return map[s.toLowerCase()] || 'UNKNOWN';
  }
}

module.exports = ExotelProvider;
