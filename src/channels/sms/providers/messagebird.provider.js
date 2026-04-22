"use strict";

const axios = require("axios");
const BaseProvider = require("./base.provider");

const BASE = "https://rest.messagebird.com";

class MessageBirdProvider extends BaseProvider {
	constructor(config = {}) {
		super(config);
		this.name = "messagebird";
	}

	_headers() {
		return { Authorization: `AccessKey ${this.config.accessKey}`, "Content-Type": "application/json" };
	}

	async send(payload) {
		try {
			const body = {
				originator: payload.from || this.config.originator || "MessageBird",
				recipients: [payload.to],
				body: payload.message,
				datacoding: payload.unicode ? "unicode" : "plain",
			};
			if (payload.metadata?.dlrUrl) {
				body.reportUrl = payload.metadata.dlrUrl;
			}
			const res = await axios.post(`${BASE}/messages`, body, { headers: this._headers(), timeout: 15000 });
			const item = res.data?.recipients?.items?.[0];
			const ok = res.data?.id != null;
			return {
				success: ok,
				providerMessageId: res.data?.id || null,
				status: ok ? this.mapStatus(item?.status || "") : "FAILED",
				cost: parseFloat(res.data?.recipients?.totalPrice || 0),
				currency: res.data?.recipients?.totalPriceCurrency || "EUR",
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

	async getDeliveryStatus(providerMessageId) {
		try {
			const res = await axios.get(`${BASE}/messages/${providerMessageId}`, {
				headers: this._headers(),
				timeout: 10000,
			});
			const item = res.data?.recipients?.items?.[0];
			return { status: this.mapStatus(item?.status || ""), rawResponse: res.data };
		} catch (err) {
			return { status: "UNKNOWN", rawResponse: { error: err.message } };
		}
	}

	async getBalance() {
		try {
			const res = await axios.get(`${BASE}/balance`, { headers: this._headers(), timeout: 10000 });
			return {
				balance: parseFloat(res.data?.amount || 0),
				currency: res.data?.payment?.currency || "EUR",
				rawResponse: res.data,
			};
		} catch (err) {
			return { balance: 0, currency: "EUR", rawResponse: { error: err.message } };
		}
	}

	mapStatus(s = "") {
		const map = {
			sent: "SENT",
			delivered: "DELIVERED",
			delivery_failed: "FAILED",
			buffered: "QUEUED",
			expired: "UNDELIVERED",
			failed: "FAILED",
		};
		return map[s.toLowerCase()] || "UNKNOWN";
	}
}

module.exports = MessageBirdProvider;
