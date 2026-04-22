'use strict';

const mongoose = require('mongoose');

const smsTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true, trim: true }, // Unique, env-independent identifier
  body: { type: String, required: true },
  category: {
    type: String,
    enum: ['TRANSACTIONAL', 'PROMOTIONAL', 'OTP'],
    default: 'TRANSACTIONAL',
  },
  dltTemplateId: { type: String },   // TRAI DLT template ID
  dltEntityId: { type: String },     // TRAI DLT principal entity ID
  senderId: String,
  provider: String,
  tenantId: { type: String, index: true },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
  deletedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  variables: [String],               // e.g. ['name', 'otp']
  metadata: { type: Object, default: {} }, // Additional info
}, {
  timestamps: true,
  versionKey: false,
});

// Unique indexes for code and name per tenant
smsTemplateSchema.index({ code: 1, tenantId: 1 }, { unique: true });
smsTemplateSchema.index({ name: 1, tenantId: 1 }, { unique: true });

const SmsTemplate = mongoose.model('SmsTemplate', smsTemplateSchema);
module.exports = SmsTemplate;
