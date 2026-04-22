'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

const BASE = 'https://smsgateway.me/api/v4';

class SMSGatewayProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'smsgateway';
    this._auth = Buffer.from(`${config.email}:${config.password}`).toString('base64');
  }

  _headers() {
    return { Authorization: `Basic ${this._auth}`, 'Content-Type': 'application/json' };
  }

  async send(payload) {
    try {
      const body = {
        phone_number: payload.to,
        message: payload.message,
        device_id: parseInt(this.config.deviceId, 10),
      };
      const res = await axios.post(`${BASE}/message/send`, body, {
        headers: this._headers(),
        timeout: 15000,
      });
      const data = res.data;
      return {
        success: true,
        providerMessageId: String(data.id || data.success?.[0]?.id || ''),
        status: 'QUEUED',
        cost: 0,
        currency: 'USD',
        rawResponse: data,
      };
    } catch (err) {
      return {
        success: false,
        providerMessageId: null,
        status: 'FAILED',
        cost: 0,
        currency: 'USD',
        rawResponse: { error: err.response?.data || err.message },
      };
    }
  }

  async getDeliveryStatus(providerMessageId) {
    try {
      const res = await axios.get(`${BASE}/message/${providerMessageId}`, {
        headers: this._headers(),
        timeout: 10000,
      });
      return { status: this.mapStatus(res.data?.status), rawResponse: res.data };
    } catch (err) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  async getBalance() {
    return { balance: 0, currency: 'N/A', rawResponse: { note: 'SMSGateway.me is free — device-based' } };
  }

  mapStatus(s = '') {
    const lower = s.toLowerCase();
    if (lower === 'delivered') return 'DELIVERED';
    if (lower === 'sent') return 'SENT';
    if (lower === 'failed' || lower === 'error') return 'FAILED';
    if (lower === 'queued' || lower === 'pending') return 'QUEUED';
    return 'UNKNOWN';
  }
}

module.exports = SMSGatewayProvider;
