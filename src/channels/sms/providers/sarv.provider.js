"use strict";

const axios = require("axios");
const BaseProvider = require("./base.provider");

const BASE = "https://api.sarv.com/v2";

class SarvProvider extends BaseProvider {
	constructor(config = {}) {
		super(config);
		this.name = "sarv";
	}

	_headers() {
		return { api_key: this.config.apiKey, "Content-Type": "application/json" };
	}

	async send(payload) {
		try {
			const to = payload.to.replace(/^\+91/, "").replace(/\D/g, "");
			const body = {
				mobile: to,
				message: payload.message,
				sender_id: payload.from || this.config.senderId,
				route: this.config.route || "TA", // TA = transactional, PR = promotional
				...(this.config.peid && { pe_id: this.config.peid }),
				...(this.config.dltTemplateId && { template_id: this.config.dltTemplateId }),
				...(payload.metadata?.dltTemplateId && { template_id: payload.metadata.dltTemplateId }),
				...(payload.unicode && { unicode: "1" }),
			};
			const res = await axios.post(`${BASE}/message/send`, body, { headers: this._headers(), timeout: 15000 });
			const ok = res.data?.status === "success" || res.data?.code === 200;
			return {
				success: ok,
				providerMessageId: res.data?.requestId || res.data?.message_id || null,
				status: ok ? "QUEUED" : "FAILED",
				cost: 0,
				currency: "INR",
				rawResponse: res.data,
			};
		} catch (err) {
			return {
				success: false,
				providerMessageId: null,
				status: "FAILED",
				cost: 0,
				currency: "INR",
				rawResponse: { error: err.response?.data || err.message },
			};
		}
	}

	async getDeliveryStatus() {
		return { status: "UNKNOWN", rawResponse: { note: "Sarv DLR via webhook only" } };
	}

	async getBalance() {
		try {
			const res = await axios.get(`${BASE}/account/balance`, { headers: this._headers(), timeout: 10000 });
			return { balance: parseFloat(res.data?.balance || 0), currency: "INR", rawResponse: res.data };
		} catch (err) {
			return { balance: 0, currency: "INR", rawResponse: { error: err.message } };
		}
	}
}

module.exports = SarvProvider;
