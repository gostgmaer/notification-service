'use strict';
// OTP store — keeps pending OTPs in MongoDB, not in-memory, so it survives restarts

const mongoose = require('mongoose');

const otpStoreSchema = new mongoose.Schema({
  to: { type: String, required: true, index: true },
  referenceId: { type: String, required: true, index: true },
  tenantId: { type: String },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  messageId: String,
}, {
  timestamps: true,
  versionKey: false,
});

// TTL: auto-delete after expiry + 1 hour buffer
otpStoreSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });
otpStoreSchema.index({ referenceId: 1, tenantId: 1 });
otpStoreSchema.index({ tenantId: 1, to: 1 });

const OtpStore = mongoose.model('OtpStore', otpStoreSchema);
module.exports = OtpStore;
