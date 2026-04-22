'use strict';

const axios = require('axios');
const BaseProvider = require('./base.provider');

// ValueFirst (Tanla) — XML/REST API
const BASE = 'https://api.myvfirst.com/smpp/sendsms';

class ValueFirstProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'valuefirst';
  }

  async send(payload) {
    try {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<MESSAGE VER="1.0">
  <USER USERNAME="${this.config.username}" PASSWORD="${this.config.password}" UNIXTIMESTAMP=""/>
  <SMS UDH="0" CODING="${payload.unicode ? '1' : '0'}" TEXT="${this._escapeXml(payload.message)}" PROPERTY="0" ID="1">
    <ADDRESS FROM="${payload.from || this.config.sender}" TO="${payload.to.replace(/^\+/, '')}" SEQ="1" TAG="${payload.referenceId || ''}"/>
  </SMS>
</MESSAGE>`;
      const res = await axios.post(BASE, xml, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 15000,
      });
      const raw = res.data?.toString() || '';
      const guidMatch = raw.match(/GUID="([^"]+)"/);
      const errMatch = raw.match(/ERR="([^"]+)"/);
      const ok = guidMatch && !errMatch;
      return {
        success: !!ok,
        providerMessageId: ok ? guidMatch[1] : null,
        status: ok ? 'SENT' : 'FAILED',
        cost: 0,
        currency: 'INR',
        rawResponse: { xml: raw },
      };
    } catch (err) {
      return {
        success: false, providerMessageId: null, status: 'FAILED',
        cost: 0, currency: 'INR', rawResponse: { error: err.message },
      };
    }
  }

  _escapeXml(s = '') {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async getDeliveryStatus() {
    return { status: 'UNKNOWN', rawResponse: { note: 'ValueFirst DLR via webhook only' } };
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

module.exports = ValueFirstProvider;
