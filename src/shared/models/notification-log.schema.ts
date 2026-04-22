import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationLogDocument = NotificationLog & Document;

export enum NotificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
}

export enum NotificationStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying',
  PURGED = 'purged',
}

@Schema({ timestamps: true, collection: 'notification_logs' })
export class NotificationLog {
  @Prop({ required: true, enum: NotificationChannel })
  channel: NotificationChannel;

  @Prop({ index: true })
  tenantId: string;

  // ── Common ──────────────────────────────────────────────────────────────────
  @Prop({ unique: true, sparse: true })
  messageId: string;

  @Prop({ required: true })
  to: string;

  @Prop()
  from: string;

  @Prop({ enum: NotificationStatus, default: NotificationStatus.QUEUED, index: true })
  status: NotificationStatus;

  @Prop({ default: 0 })
  attempts: number;

  @Prop()
  error: string;

  @Prop({ type: Object })
  metadata: Record<string, unknown>;

  @Prop()
  referenceId: string;

  @Prop()
  idempotencyKey: string;

  // ── SMS-specific ────────────────────────────────────────────────────────────
  @Prop()
  message: string;

  @Prop()
  provider: string;

  @Prop({ type: Number })
  cost: number;

  @Prop({ type: Object })
  dlrPayload: Record<string, unknown>;

  // ── Email-specific ──────────────────────────────────────────────────────────
  @Prop()
  requestId: string;

  @Prop()
  subject: string;

  @Prop()
  template: string;

  @Prop()
  templateId: string;

  @Prop({ type: [String] })
  cc: string[];

  @Prop({ type: [String] })
  bcc: string[];

  @Prop({ type: Object })
  data: Record<string, unknown>;

  @Prop()
  retryCount: number;

  @Prop()
  sentAt: Date;

  @Prop()
  failedAt: Date;
}

export const NotificationLogSchema = SchemaFactory.createForClass(NotificationLog);

// Indexes for common queries
NotificationLogSchema.index({ channel: 1, status: 1, createdAt: -1 });
NotificationLogSchema.index({ tenantId: 1, channel: 1, createdAt: -1 });
NotificationLogSchema.index({ requestId: 1 }, { sparse: true });
