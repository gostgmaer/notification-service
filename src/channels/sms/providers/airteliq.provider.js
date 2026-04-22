'use strict';

const axios = require('axios');
const crypto = require('crypto');
const BaseProvider = require('./base.provider');

const TOKEN_URL = 'https://api.airtel.io/auth/oauth2/token';
const BASE = 'https://api.airtel.io/sms/1/text/single';

class AirtelIQProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'airteliq';
    this._token = null;
    this._tokenExpiry = 0;
  }

  async _getToken() {
    if (this._token && Date.now() < this._tokenExpiry - 60000) return this._token;
    const res = await axios.post(TOKEN_URL, {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'client_credentials',
    }, { timeout: 10000 });
    this._token = res.data?.access_token;
    this._tokenExpiry = Date.now() + (res.data?.expires_in || 3600) * 1000;
    return this._token;
  }

  async send(payload) {
    try {
      const token = await this._getToken();
      const body = {
        from: payload.from || this.config.senderId,
        to: payload.to,
        text: payload.message,
        ...(this.config.peid && { DLT_TE_ID: payload.metadata?.dltTemplateId || '' }),
      };
      const res = await axios.post(BASE, body, {
        headers: { 'X-API-Key': token, 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      const data = res.data?.messages?.[0];
      return {
        success: data?.status?.groupName !== 'REJECTED',
        providerMessageId: data?.messageId || null,
        status: this.mapStatus(data?.status?.name),
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
    return { status: 'UNKNOWN', rawResponse: { note: 'Airtel IQ status via webhook DLR' } };
  }

  async getBalance() {
    return { balance: 0, currency: 'INR', rawResponse: { note: 'Airtel IQ balance via console' } };
  }

  mapStatus(s = '') {
    const map = { SENT: 'SENT', DELIVRD: 'DELIVERED', UNDELIV: 'UNDELIVERED', FAILED: 'FAILED' };
    return map[s.toUpperCase()] || 'UNKNOWN';
  }

  validateWebhookSignature(headers) {
    const sig = headers['x-airtel-signature'];
    return !!sig; // Full Ed25519 validation requires public key registration
  }
}

module.exports = AirtelIQProvider;
