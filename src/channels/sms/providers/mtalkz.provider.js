"use strict";

const axios = require("axios");
const BaseProvider = require("./base.provider");

const BASE = "https://smpp.mtalkz.com/api/mt";

class MtalkzProvider extends BaseProvider {
	constructor(config = {}) {
		super(config);
		this.name = "mtalkz";
	}

	_channel(messageType) {
		if (messageType === "otp") return "OTP";
		if (messageType === "promotional") return "PROMO";
		return "TRANS";
	}

	async send(payload) {
		try {
			const body = {
				User: this.config.username,
				passwd: this.config.password,
				senderid: payload.from || this.config.senderId,
				channel: this._channel(payload.messageType),
				DCS: payload.unicode ? "8" : "0",
				flashsms: "0",
				number: payload.to.replace(/^\+/, ""),
				text: payload.message,
				route: this.config.route || "1",
				...(this.config.peid && { Peid: this.config.peid }),
				...(this.config.dltTemplateId && { DltTemplateId: this.config.dltTemplateId }),
				...(payload.metadata?.dltTemplateId && { DltTemplateId: payload.metadata.dltTemplateId }),
			};
			const res = await axios.post(`${BASE}/SendSMS`, body, {
				headers: { "Content-Type": "application/json" },
				timeout: 15000,
			});
			const ok = res.data?.statusCode === "SMSCountSucceed";
			return {
				success: ok,
				providerMessageId: res.data?.messageId || null,
				status: ok ? "SENT" : "FAILED",
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
		// Mtalkz delivers status via DLR webhook callback
		return { status: "UNKNOWN", rawResponse: { note: "Mtalkz DLR via webhook only" } };
	}

	async getBalance() {
		try {
			const res = await axios.get(`${BASE}/GetBalance`, {
				params: { User: this.config.username, passwd: this.config.password },
				timeout: 10000,
			});
			return { balance: parseFloat(res.data?.balance || 0), currency: "INR", rawResponse: res.data };
		} catch (err) {
			return { balance: 0, currency: "INR", rawResponse: { error: err.message } };
		}
	}

	mapStatus(s = "") {
		const map = {
			DELIVERED: "DELIVERED",
			SENT: "SENT",
			FAILED: "FAILED",
			UNDELIVERED: "UNDELIVERED",
			PENDING: "SENDING",
		};
		return map[s.toUpperCase()] || "UNKNOWN";
	}
}

module.exports = MtalkzProvider;
