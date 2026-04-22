import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SmsLog, SmsLogDocument } from '../schemas/sms-log.schema';

@Injectable()
export class SmsWebhookService {
  private readonly logger = new Logger(SmsWebhookService.name);

  constructor(
    @InjectModel(SmsLog.name) private readonly smsLogModel: Model<SmsLogDocument>,
  ) {}

  async processWebhook(
    provider: string,
    body: any,
    signature: string,
    headers: Record<string, string>,
    url: string,
  ): Promise<any> {
    const fields = this._extractFields(provider, body);
    const { providerMessageId, status, dlrCode, errorCode, deliveredAt } = fields;

    if (providerMessageId) {
      const mappedStatus = this._mapStatus(provider, status);
      await this.smsLogModel.findOneAndUpdate(
        { providerMessageId },
        {
          $set: {
            status: mappedStatus,
            dlrReceived: true,
            dlrTimestamp: deliveredAt ? new Date(deliveredAt) : new Date(),
            dlrPayload: body,
            deliveredAt: mappedStatus === 'DELIVERED' ? new Date() : undefined,
          },
        },
      );
    }

    return { provider, processed: true };
  }

  private _mapStatus(provider: string, status: string): string {
    const s = (status || '').toLowerCase();
    if (['delivered', 'delivery_success', 'delivrd'].includes(s)) return 'DELIVERED';
    if (['failed', 'failure', 'undelivered', 'expired'].includes(s)) return 'FAILED';
    if (['sent', 'accepted', 'submitted'].includes(s)) return 'SENT';
    return 'UNKNOWN';
  }

  private _extractFields(provider: string, raw: any): any {
    switch (provider) {
      case 'twilio':
        return { providerMessageId: raw.MessageSid, status: raw.MessageStatus, dlrCode: raw.ErrorCode, errorCode: raw.ErrorCode };
      case 'vonage':
        return { providerMessageId: raw['message-id'], status: raw.status, dlrCode: raw['err-code'], errorCode: raw['err-code'], deliveredAt: raw['message-timestamp'] };
      case 'msg91':
        return { providerMessageId: raw.requestId, status: raw.status, dlrCode: raw.desc, errorCode: raw.cause };
      case 'fast2sms':
        return { providerMessageId: raw.requestId || raw.request_id, status: raw.status, dlrCode: raw.errorCode, errorCode: raw.errorCode };
      case 'd7networks':
        return { providerMessageId: raw.messageId, status: raw.status, dlrCode: raw.statusCode, errorCode: raw.errorCode };
      case 'sinch':
        return { providerMessageId: raw.batch_id || raw.message_id, status: raw.status?.code || raw.status, dlrCode: raw.status?.code, errorCode: raw.status?.description };
      case 'plivo':
        return { providerMessageId: raw.MessageUUID, status: raw.Status, dlrCode: raw.ErrorCode, errorCode: raw.ErrorCode };
      case 'infobip':
        return { providerMessageId: raw.results?.[0]?.messageId || raw.messageId, status: raw.results?.[0]?.status?.name || raw.status, deliveredAt: raw.results?.[0]?.sentAt };
      case 'telnyx':
        return { providerMessageId: raw.data?.payload?.id, status: raw.data?.payload?.to?.[0]?.status || raw.data?.payload?.type };
      default:
        return { providerMessageId: raw.messageId || raw.message_id || raw.msgid, status: raw.status || raw.deliveryStatus, dlrCode: raw.errorCode || raw.error_code, deliveredAt: raw.deliveredAt || raw.delivered_at };
    }
  }
}
