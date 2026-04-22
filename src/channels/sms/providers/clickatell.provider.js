"use strict";

const axios = require("axios");
const BaseProvider = require("./base.provider");

const BASE = "https://platform.clickatell.com";

class ClickatellProvider extends BaseProvider {
	constructor(config = {}) {
		super(config);
		this.name = "clickatell";
	}

	_headers() {
		return { Authorization: this.config.apiKey, "Content-Type": "application/json" };
	}

	async send(payload) {
		try {
			const message = { channel: "sms", to: [payload.to], content: payload.message };
			if (payload.from || this.config.from) {
				message.from = payload.from || this.config.from;
			}
			const res = await axios.post(
				`${BASE}/messages`,
				{ messages: [message] },
				{ headers: this._headers(), timeout: 15000 },
			);
			const msg = res.data?.messages?.[0];
			const ok = msg?.accepted === true;
			return {
				success: ok,
				providerMessageId: msg?.apiMessageId || null,
				status: ok ? "QUEUED" : "FAILED",
				cost: 0,
				currency: "USD",
				rawResponse: res.data,
			};
		} catch (err) {
			return {
				success: false,
				providerMessageId: null,
				status: "FAILED",
				cost: 0,
				currency: "USD",
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
			const s = res.data?.data?.status?.description || "";
			return { status: this.mapStatus(s), rawResponse: res.data };
		} catch (err) {
			return { status: "UNKNOWN", rawResponse: { error: err.message } };
		}
	}

	async getBalance() {
		try {
			const res = await axios.get("https://api.clickatell.com/rest/account", {
				headers: this._headers(),
				timeout: 10000,
			});
			return { balance: parseFloat(res.data?.data?.balance || 0), currency: "USD", rawResponse: res.data };
		} catch (err) {
			return { balance: 0, currency: "USD", rawResponse: { error: err.message } };
		}
	}

	mapStatus(s = "") {
		const map = {
			Delivered: "DELIVERED",
			"Message Sent": "SENT",
			"Not Delivered": "UNDELIVERED",
			"Message Queued": "QUEUED",
			Error: "FAILED",
		};
		return map[s] || "UNKNOWN";
	}
}

module.exports = ClickatellProvider;
