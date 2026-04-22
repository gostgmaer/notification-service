"use strict";

const axios = require("axios");
const BaseProvider = require("./base.provider");

const BASE = "https://rest.textmagic.com/api/v2";

class TextMagicProvider extends BaseProvider {
	constructor(config = {}) {
		super(config);
		this.name = "textmagic";
	}

	_headers() {
		return {
			"X-TM-Username": this.config.username,
			"X-TM-Key": this.config.apiKey,
			"Content-Type": "application/json",
		};
	}

	async send(payload) {
		try {
			const body = { text: payload.message, phones: payload.to };
			if (payload.from || this.config.senderId) {
				body.from = payload.from || this.config.senderId;
			}
			const res = await axios.post(`${BASE}/messages`, body, { headers: this._headers(), timeout: 15000 });
			return {
				success: true,
				providerMessageId: String(res.data?.id || ""),
				status: "QUEUED",
				cost: parseFloat(res.data?.price || 0),
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
			return { status: this.mapStatus(res.data?.status || ""), rawResponse: res.data };
		} catch (err) {
			return { status: "UNKNOWN", rawResponse: { error: err.message } };
		}
	}

	async getBalance() {
		try {
			const res = await axios.get(`${BASE}/user`, { headers: this._headers(), timeout: 10000 });
			return { balance: parseFloat(res.data?.balance || 0), currency: "USD", rawResponse: res.data };
		} catch (err) {
			return { balance: 0, currency: "USD", rawResponse: { error: err.message } };
		}
	}

	// TextMagic single-char status codes
	mapStatus(s = "") {
		const map = { q: "QUEUED", r: "QUEUED", s: "SENT", d: "DELIVERED", e: "FAILED", f: "FAILED", b: "UNDELIVERED" };
		return map[s.toLowerCase()] || "UNKNOWN";
	}
}

module.exports = TextMagicProvider;
