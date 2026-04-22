"use strict";

const axios = require("axios");
const BaseProvider = require("./base.provider");

const BASE = "https://api.bulksms.com/v1";

class BulkSMSProvider extends BaseProvider {
	constructor(config = {}) {
		super(config);
		this.name = "bulksms";
	}

	_auth() {
		return {
			username: this.config.tokenId || this.config.username,
			password: this.config.tokenSecret || this.config.password,
		};
	}

	async send(payload) {
		try {
			const body = { to: payload.to, body: payload.message, encoding: payload.unicode ? "UNICODE" : "TEXT" };
			if (payload.from || this.config.from) {
				body.from = payload.from || this.config.from;
			}
			const res = await axios.post(`${BASE}/messages`, body, {
				auth: this._auth(),
				headers: { "Content-Type": "application/json" },
				timeout: 15000,
			});
			const msg = Array.isArray(res.data) ? res.data[0] : res.data;
			const ok = ["ACCEPTED", "SCHEDULED"].includes(msg?.status?.type?.toUpperCase());
			return {
				success: !!ok,
				providerMessageId: msg?.id || null,
				status: ok ? "QUEUED" : "FAILED",
				cost: parseFloat(msg?.creditCost || 0),
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
			const res = await axios.get(`${BASE}/messages/${providerMessageId}`, { auth: this._auth(), timeout: 10000 });
			return { status: this.mapStatus(res.data?.status?.type || ""), rawResponse: res.data };
		} catch (err) {
			return { status: "UNKNOWN", rawResponse: { error: err.message } };
		}
	}

	async getBalance() {
		try {
			const res = await axios.get(`${BASE}/profile`, { auth: this._auth(), timeout: 10000 });
			return { balance: parseFloat(res.data?.credits?.balance || 0), currency: "USD", rawResponse: res.data };
		} catch (err) {
			return { balance: 0, currency: "USD", rawResponse: { error: err.message } };
		}
	}

	mapStatus(s = "") {
		const map = {
			ACCEPTED: "QUEUED",
			SCHEDULED: "QUEUED",
			SENT: "SENT",
			DELIVERED: "DELIVERED",
			FAILED: "FAILED",
			REJECTED: "FAILED",
			EXPIRED: "UNDELIVERED",
		};
		return map[s.toUpperCase()] || "UNKNOWN";
	}
}

module.exports = BulkSMSProvider;
