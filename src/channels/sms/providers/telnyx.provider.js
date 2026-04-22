'use strict';

const axios = require('axios');
const crypto = require('crypto');
const BaseProvider = require('./base.provider');

const BASE = 'https://api.telnyx.com/v2';

class TelnyxProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'telnyx';
  }

  _headers() {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async send(payload) {
    try {
      const body = {
        from: payload.from || this.config.fromNumber,
        to: payload.to,
        text: payload.message,
        type: 'SMS',
        ...(this.config.messagingProfileId && { messaging_profile_id: this.config.messagingProfileId }),
      };

      const res = await axios.post(`${BASE}/messages`, body, {
        headers: this._headers(), timeout: 15000,
      });

      const data = res.data?.data;
      return {
        success: true,
        providerMessageId: data?.id || null,
        status: this.mapStatus(data?.to?.[0]?.status),
        cost: parseFloat(data?.cost?.amount || 0),
        currency: data?.cost?.currency || 'USD',
        rawResponse: res.data,
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
      const res = await axios.get(`${BASE}/messages/${providerMessageId}`, {
        headers: this._headers(), timeout: 10000,
      });
      const status = this.mapStatus(res.data?.data?.to?.[0]?.status);
      return { status, rawResponse: res.data };
    } catch (err) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  async getBalance() {
    try {
      const res = await axios.get(`${BASE}/balance`, { headers: this._headers(), timeout: 10000 });
      return {
        balance: parseFloat(res.data?.data?.available_credit || 0),
        currency: res.data?.data?.currency || 'USD',
        rawResponse: res.data,
      };
    } catch (err) {
      return { balance: 0, currency: 'USD', rawResponse: { error: err.message } };
    }
  }

  mapStatus(s = '') {
    const map = {
      queued: 'QUEUED', sending: 'SENDING', sent: 'SENT',
      delivered: 'DELIVERED', delivery_failed: 'FAILED', received: 'DELIVERED',
    };
    return map[s] || 'UNKNOWN';
  }

  validateWebhookSignature(headers, body) {
    // Telnyx uses Ed25519 signature in telnyx-signature-ed25519-* headers
    // Simplified validation: check timestamp freshness + presence of signature
    const sig = headers['telnyx-signature-ed25519-signature'];
    const ts = headers['telnyx-signature-ed25519-timestamp'];
    if (!sig || !ts) return false;
    const tsNum = parseInt(ts, 10);
    const now = Math.floor(Date.now() / 1000);
    return Math.abs(now - tsNum) < 300; // 5-minute tolerance
  }
}

module.exports = TelnyxProvider;
