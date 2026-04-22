"use strict";

const axios = require("axios");
const BaseProvider = require("./base.provider");

const BASE = "https://api.brevo.com/v3";

class BrevoProvider extends BaseProvider {
	constructor(config = {}) {
		super(config);
		this.name = "brevo";
	}

	_headers() {
		return { "api-key": this.config.apiKey, "Content-Type": "application/json" };
	}

	async send(payload) {
		try {
			const body = {
				sender: payload.from || this.config.sender || "Alert",
				recipient: payload.to,
				content: payload.message,
				type: payload.messageType === "promotional" ? "marketing" : "transactional",
			};
			const res = await axios.post(`${BASE}/transactionalSMS/sms`, body, { headers: this._headers(), timeout: 15000 });
			return {
				success: true,
				providerMessageId: String(res.data?.messageId || ""),
				status: "SENT",
				cost: parseFloat(res.data?.usedCredits || 0),
				currency: "EUR",
				rawResponse: res.data,
			};
		} catch (err) {
			return {
				success: false,
				providerMessageId: null,
				status: "FAILED",
				cost: 0,
				currency: "EUR",
				rawResponse: { error: err.response?.data || err.message },
			};
		}
	}

	async getDeliveryStatus() {
		// Brevo does not expose a per-message SMS status poll endpoint
		return { status: "UNKNOWN", rawResponse: { note: "Brevo SMS DLR via webhook only" } };
	}

	async getBalance() {
		try {
			const res = await axios.get(`${BASE}/account`, { headers: this._headers(), timeout: 10000 });
			const smsPlan = (res.data?.plan || []).find((p) => p.type === "sms");
			return { balance: parseFloat(smsPlan?.credits || 0), currency: "EUR", rawResponse: res.data };
		} catch (err) {
			return { balance: 0, currency: "EUR", rawResponse: { error: err.message } };
		}
	}
}

module.exports = BrevoProvider;
