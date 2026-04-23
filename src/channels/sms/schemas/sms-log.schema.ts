import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type SmsLogDocument = SmsLog & Document;

const attemptSchema = new mongoose.Schema(
  {
    attemptNumber: Number,
    provider: String,
    timestamp: { type: Date, default: Date.now },
    status: String,
    providerMessageId: String,
    rawResponse: mongoose.Schema.Types.Mixed,
    error: String,
    durationMs: Number,
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false },
);

@Schema({ timestamps: true, collection: 'sms_logs' })
export class SmsLog {
  @Prop({ required: true, unique: true, index: true })
  messageId: string;

  @Prop({ index: true, sparse: true })
  providerMessageId: string;

  @Prop({ required: true, index: true })
  provider: string;

  @Prop({ default: false })
  fallbackUsed: boolean;

  @Prop({ required: true, index: true })
  to: string;

  @Prop()
  toCountryCode: string;

  @Prop()
  from: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Types.ObjectId, ref: 'SmsTemplate', index: true })
  templateId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  templateVariables: Record<string, unknown>;

  @Prop({
    type: String,
    enum: ['TRANSACTIONAL', 'PROMOTIONAL', 'OTP', 'FLASH'],
    default: 'TRANSACTIONAL',
    index: true,
  })
  messageType: string;

  @Prop({ default: false })
  unicode: boolean;

  @Prop()
  messageLength: number;

  @Prop()
  segmentCount: number;

  @Prop({
    type: String,
    enum: ['QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'UNDELIVERED', 'REJECTED', 'UNKNOWN', 'RETRYING', 'PURGED'],
    default: 'QUEUED',
    index: true,
  })
  status: string;

  @Prop({ type: [statusHistorySchema], default: [] })
  statusHistory: Array<{ status: string; timestamp: Date; note?: string }>;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  providerResponse: Record<string, unknown>;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  providerError: Record<string, unknown>;

  @Prop()
  errorCode: string;

  @Prop()
  errorMessage: string;

  @Prop({ type: [attemptSchema], default: [] })
  attempts: Array<{
    attemptNumber: number;
    provider: string;
    timestamp: Date;
    status: string;
    providerMessageId?: string;
    rawResponse?: unknown;
    error?: string;
    durationMs?: number;
  }>;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ index: true, sparse: true })
  nextRetryAt: Date;

  @Prop()
  queuedAt: Date;

  @Prop()
  sentAt: Date;

  @Prop()
  deliveredAt: Date;

  @Prop()
  durationMs: number;

  @Prop()
  cost: number;

  @Prop()
  currency: string;

  @Prop({ default: false })
  dlrReceived: boolean;

  @Prop()
  dlrTimestamp: Date;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  dlrPayload: Record<string, unknown>;

  @Prop({ index: true })
  tenantId: string;

  @Prop()
  userId: string;

  @Prop({ type: Types.ObjectId, ref: 'SmsCampaign', index: true, sparse: true })
  campaignId: Types.ObjectId;

  @Prop({ index: true, sparse: true })
  referenceId: string;

  @Prop({ type: [String], index: true })
  tags: string[];

  @Prop({ type: mongoose.Schema.Types.Mixed })
  metadata: Record<string, unknown>;

  @Prop()
  dltTemplateId: string;

  @Prop()
  dltEntityId: string;

  @Prop()
  gdprPurgedAt: Date;
}

export const SmsLogSchema = SchemaFactory.createForClass(SmsLog);
SmsLogSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
SmsLogSchema.index({ tenantId: 1, provider: 1, createdAt: -1 });
SmsLogSchema.index({ tenantId: 1, createdAt: -1 });
SmsLogSchema.index({ tenantId: 1, referenceId: 1 }, { sparse: true });
