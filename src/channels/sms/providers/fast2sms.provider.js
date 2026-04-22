'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

const BASE_URL = 'https://www.fast2sms.com/dev/bulkV2';
const STATUS_URL = 'https://www.fast2sms.com/dev/bulk';

class Fast2SMSProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'fast2sms';
  }

  async send(payload) {
    const to = payload.to.replace(/^\+91/, '').replace(/\D/g, '');
    const params = {
      authorization: this.config.apiKey,
      route: this.config.route || 'q',
      message: payload.message,
      language: 'english',
      flash: '0',
      numbers: to,
    };

    if (this.config.route === 'dlt') {
      params.sender_id = this.config.senderId;
      if (this.config.dltEntityId) params.entity_id = this.config.dltEntityId;
    }

    try {
      const res = await axios.get(BASE_URL, { params, timeout: 10000 });
      const data = res.data;

      if (data.return === true) {
        return {
          success: true,
          providerMessageId: data.request_id,
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
      const res = await axios.get(`${STATUS_URL}`, {
        params: {
          authorization: this.config.apiKey,
          request_id: providerMessageId,
          type: 'delivery_report',
        },
        timeout: 10000,
      });
      const status = this.mapStatus(res.data?.status || '');
      return { status, rawResponse: res.data };
    } catch (err) {
      return { status: 'UNKNOWN', rawResponse: { error: err.message } };
    }
  }

  async getBalance() {
    const res = await axios.get('https://www.fast2sms.com/dev/wallet', {
      params: { authorization: this.config.apiKey },
      timeout: 10000,
    });
    return {
      balance: parseFloat(res.data?.wallet || 0),
      currency: 'INR',
      rawResponse: res.data,
    };
  }

  mapStatus(s) {
    if (s === '0' || s === 'Delivered') return 'DELIVERED';
    if (s === '1' || s === 'Pending') return 'SENDING';
    if (s === '2' || s === 'NotDelivered') return 'UNDELIVERED';
    return 'UNKNOWN';
  }
}

module.exports = Fast2SMSProvider;
