"use strict";

const axios = require("axios");
const BaseProvider = require("./base.provider");

const BASE = "http://enterprise.smsgupshup.com/GatewayAPI/rest";

class PinnacleProvider extends BaseProvider {
	constructor(config = {}) {
		super(config);
		this.name = "pinnacle";
	}

	_route(messageType) {
		if (messageType === "otp" || messageType === "transactional") return this.config.transRoute || "01";
		return this.config.promoRoute || "06";
	}

	async send(payload) {
		try {
			const to = payload.to.replace(/^\+91/, "").replace(/\D/g, "");
			const params = {
				method: "SendMessage",
				send_to: to,
				msg: payload.message,
				msg_type: payload.unicode ? "UnicodeText" : "Text",
				userid: this.config.userId,
				auth_scheme: "plain",
				password: this.config.password,
				v: "1.1",
				format: "JSON",
				sender_id: payload.from || this.config.senderId,
				route: this._route(payload.messageType),
				...(this.config.peid && { principal_entity_id: this.config.peid }),
				...(this.config.dltTemplateId && { dlt_template_id: this.config.dltTemplateId }),
				...(payload.metadata?.dltTemplateId && { dlt_template_id: payload.metadata.dltTemplateId }),
			};
			const res = await axios.get(BASE, { params, timeout: 15000 });
			const data = res.data;
			const ok = data?.response?.status?.toUpperCase() === "SUCCESS";
			return {
				success: ok,
				providerMessageId: data?.response?.id || null,
				status: ok ? "SENT" : "FAILED",
				cost: 0,
				currency: "INR",
				rawResponse: data,
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
		return { status: "UNKNOWN", rawResponse: { note: "Pinnacle DLR via webhook only" } };
	}

	async getBalance() {
		try {
			const params = {
				method: "GetBalance",
				userid: this.config.userId,
				auth_scheme: "plain",
				password: this.config.password,
				v: "1.1",
				format: "JSON",
			};
			const res = await axios.get(BASE, { params, timeout: 10000 });
			return { balance: parseFloat(res.data?.response?.balance || 0), currency: "INR", rawResponse: res.data };
		} catch (err) {
			return { balance: 0, currency: "INR", rawResponse: { error: err.message } };
		}
	}
}

module.exports = PinnacleProvider;
