'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

class InfobipProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'infobip';
    this.baseUrl = (config.baseUrl || '').replace(/\/$/, '');
  }

  _headers() {
    return {
      Authorization: `App ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  async send(payload) {
    try {
      const body = {
        messages: [{
          from: payload.from || this.config.sender,
          destinations: [{ to: payload.to }],
          text: payload.message,
          ...(payload.metadata?.dltTemplateId && {
            regional: {
              indiaDlt: {
                contentTemplateId: payload.metadata.dltTemplateId,
                principalEntityId: payload.metadata.dltEntityId || '',
              },
            },
          }),
        }],
      };

      const res = await axios.post(`${this.baseUrl}/sms/2/text/advanced`, body, {
        headers: this._headers(),
        timeout: 15000,
      });

      const msg = res.data?.messages?.[0];
      const success = msg?.status?.groupName !== 'REJECTED';
      return {
        success,
        providerMessageId: msg?.messageId || null,
        status: success ? 'SENT' : 'FAILED',
        cost: parseFloat(msg?.smsCount || 1) * 0.001,
        currency: 'EUR',
        rawResponse: res.data,
      };
    } catch (err) {
      return {
        success: false,
        providerMessageId: null,
        status: 'FAILED',
        cost: 0,
        currency: 'EUR',
        rawResponse: { error: err.response?.data || err.message },
      };
    }
  }

  async getDeliveryStatus(providerMessageId) {
    try {
      const res = await axios.get(
        `${this.baseUrl}/sms/1/reports?messageId=${providerMessageId}`,
        { headers: this._headers(), timeout: 10000 }
      );
      const report = res.data?.results?.[0];
      return { status: this.mapStatus(report?.status?.groupName), rawResponse: res.data };
    } catch (err) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  async getBalance() {
    try {
      const res = await axios.get(`${this.baseUrl}/account/1/balance`, {
        headers: this._headers(), timeout: 10000,
      });
      return { balance: res.data?.balance || 0, currency: res.data?.currency || 'EUR', rawResponse: res.data };
    } catch (err) {
      return { balance: 0, currency: 'EUR', rawResponse: { error: err.message } };
    }
  }

  mapStatus(s = '') {
    const map = {
      DELIVERED: 'DELIVERED', PENDING: 'SENDING', SENT: 'SENT',
      NOT_DELIVERED: 'UNDELIVERED', REJECTED: 'REJECTED', EXPIRED: 'FAILED',
    };
    return map[s.toUpperCase()] || 'UNKNOWN';
  }

  validateWebhookSignature(headers, body) {
    // Infobip uses the same API key in Authorization header for DLR callbacks
    const auth = headers['authorization'] || '';
    return auth === `App ${this.config.apiKey}`;
  }
}

module.exports = InfobipProvider;
