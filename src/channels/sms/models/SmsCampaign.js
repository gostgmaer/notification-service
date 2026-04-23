'use strict';

const mongoose = require('mongoose');

const smsCampaignSchema = new mongoose.Schema({
  campaignId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'SmsTemplate' },
  message: String,
  messageType: {
    type: String,
    enum: ['transactional', 'promotional', 'otp'],
    default: 'promotional',
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'CANCELLED'],
    default: 'DRAFT',
    index: true,
  },
  scheduledAt: Date,
  startedAt: Date,
  completedAt: Date,
  totalCount: { type: Number, default: 0 },
  sentCount: { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  tags: [String],
  tenantId: { type: String, index: true },
  createdBy: String,
  metadata: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
  versionKey: false,
});

smsCampaignSchema.index({ tenantId: 1, createdAt: -1 });

const SmsCampaign = mongoose.model('SmsCampaign', smsCampaignSchema);
module.exports = SmsCampaign;
