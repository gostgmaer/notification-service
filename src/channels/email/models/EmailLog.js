const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      index: true,
      unique: true
    },
    tenantId: {
      type: String,
      index: true,
      sparse: true
    },
    to: {
      type: [String],
      required: true
    },
    from: {
      type: String,
      required: true
    },
    cc: {
      type: [String],
      default: []
    },
    bcc: {
      type: [String],
      default: []
    },
    template: {
      type: String
    },
    templateId: {
      type: String
    },
    subject: {
      type: String
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'failed', 'retrying'],
      default: 'queued',
      index: true
    },
    messageId: {
      type: String
    },
    error: {
      message: String,
      code: String,
      stack: String
    },
    retryCount: {
      type: Number,
      default: 0
    },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true
    },
    metadata: {
      accepted: [String],
      rejected: [String],
      processingTime: Number
    },
    sentAt: {
      type: Date
    },
    failedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ tenantId: 1, createdAt: -1 });
emailLogSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
emailLogSchema.index({ tenantId: 1, idempotencyKey: 1 }, { sparse: true });

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

module.exports = EmailLog;
