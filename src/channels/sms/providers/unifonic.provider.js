"use strict";

const axios = require("axios");
const BaseProvider = require("./base.provider");

const BASE = "https://api.unifonic.com/rest";

class UnifonicProvider extends BaseProvider {
	constructor(config = {}) {
		super(config);
		this.name = "unifonic";
	}

	async send(payload) {
		try {
			const params = new URLSearchParams({
				AppSid: this.config.appSid,
				Recipient: payload.to,
				Body: payload.message,
				SenderID: payload.from || this.config.senderId || "",
			});
			if (payload.metadata?.dlrUrl) params.set("StatusCallback", payload.metadata.dlrUrl);
			const res = await axios.post(`${BASE}/SMS/Messages/SendMessage`, params.toString(), {
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				timeout: 15000,
			});
			const ok = res.data?.Success === true || res.data?.Success === "True";
			return {
				success: ok,
				providerMessageId: res.data?.data?.MessageID || null,
				status: ok ? "QUEUED" : "FAILED",
				cost: parseFloat(res.data?.data?.MessagePrice || 0),
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
			const params = new URLSearchParams({ AppSid: this.config.appSid, MessageID: providerMessageId });
			const res = await axios.post(`${BASE}/SMS/Messages/GetMessageIDStatus`, params.toString(), {
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				timeout: 10000,
			});
			return { status: this.mapStatus(res.data?.data?.Status || ""), rawResponse: res.data };
		} catch (err) {
			return { status: "UNKNOWN", rawResponse: { error: err.message } };
		}
	}

	async getBalance() {
		try {
			const params = new URLSearchParams({ AppSid: this.config.appSid });
			const res = await axios.post(`${BASE}/Account/GetBalance`, params.toString(), {
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				timeout: 10000,
			});
			return { balance: parseFloat(res.data?.data?.Balance || 0), currency: "USD", rawResponse: res.data };
		} catch (err) {
			return { balance: 0, currency: "USD", rawResponse: { error: err.message } };
		}
	}

	mapStatus(s = "") {
		const map = {
			Sent: "SENT",
			Delivered: "DELIVERED",
			NotDelivered: "UNDELIVERED",
			Queued: "QUEUED",
			Failed: "FAILED",
			Rejected: "FAILED",
		};
		return map[s] || "UNKNOWN";
	}
}

module.exports = UnifonicProvider;
