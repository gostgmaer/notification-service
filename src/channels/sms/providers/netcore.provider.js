"use strict";

const axios = require("axios");
const BaseProvider = require("./base.provider");

// Netcore Cloud (formerly Smartech) SMS API
const BASE = "https://api.netcoresmartech.com/apiv2";

class NetcoreProvider extends BaseProvider {
	constructor(config = {}) {
		super(config);
		this.name = "netcore";
	}

	_params(extra = {}) {
		return { apikey: this.config.apiKey, ...extra };
	}

	async send(payload) {
		try {
			const to = payload.to.replace(/^\+91/, "").replace(/\D/g, "");
			const params = this._params({
				type: "sms",
				senderid: payload.from || this.config.senderId,
				msg: payload.message,
				mobile: to,
				pe_id: this.config.peid || "",
				templateid: payload.metadata?.dltTemplateId || this.config.dltTemplateId || "",
				...(payload.unicode && { coding: "1" }),
			});
			const res = await axios.get(`${BASE}/`, { params, timeout: 15000 });
			const body = res.data;
			const ok =
				String(body?.status).toUpperCase() === "OK" || String(body?.response?.status).toUpperCase() === "SUCCESS";
			return {
				success: ok,
				providerMessageId: body?.messageId || body?.response?.messageId || null,
				status: ok ? "SENT" : "FAILED",
				cost: 0,
				currency: "INR",
				rawResponse: body,
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
		return { status: "UNKNOWN", rawResponse: { note: "Netcore DLR via webhook only" } };
	}

	async getBalance() {
		try {
			const res = await axios.get(`${BASE}/`, { params: this._params({ type: "balance" }), timeout: 10000 });
			return {
				balance: parseFloat(res.data?.credits || res.data?.balance || 0),
				currency: "INR",
				rawResponse: res.data,
			};
		} catch (err) {
			return { balance: 0, currency: "INR", rawResponse: { error: err.message } };
		}
	}
}

module.exports = NetcoreProvider;
