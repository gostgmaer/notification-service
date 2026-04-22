import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { SmsLog, SmsLogDocument } from '../schemas/sms-log.schema';
import { SmsProvidersService } from '../config/sms-providers.service';
import { CacheService } from '../../../shared/cache/cache.service';
import { SendSmsDto } from '../dto/send-sms.dto';

// JS utilities (CommonJS interop)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { normalisePhone } = require('../../../shared/utils/phoneNormalizer');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { render, calculateSegments } = require('../services/templateEngine');

// Mongoose models for OTP and template (JS legacy models)
// These are registered by MongooseModule in sms.module.ts
let OtpStore: any;
let SmsTemplate: any;

function getOtpStore(): any {
  if (!OtpStore) OtpStore = require('../models/OtpStore');
  return OtpStore;
}
function getSmsTemplate(): any {
  if (!SmsTemplate) SmsTemplate = require('../models/SmsTemplate');
  return SmsTemplate;
}

const TRANSIENT_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ERR_NETWORK', 'EAI_AGAIN']);

function _isTransientError(result: any): boolean {
  if (!result) return false;
  const code = result.rawResponse?.code || result.rawResponse?.error || '';
  return TRANSIENT_CODES.has(code);
}

function _retryDelay(attempt: number): number {
  const delays = [30_000, 2 * 60_000, 10 * 60_000];
  return delays[Math.min(attempt, delays.length - 1)];
}

function _generateOtp(length = 6): string {
  let otp = '';
  while (otp.length < length) otp += Math.floor(Math.random() * 10).toString();
  return otp;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @InjectModel(SmsLog.name) private readonly smsLogModel: Model<SmsLogDocument>,
    private readonly providers: SmsProvidersService,
    private readonly cache: CacheService,
    private readonly config: ConfigService,
  ) {}

  private async _resolveTemplate(payload: SendSmsDto, tenantId: string | null) {
    const Template = getSmsTemplate();
    const tenantFilter = tenantId ? { tenantId } : {};

    if (payload.templateCode || payload.templateName || payload.templateId) {
      const cacheKey = `sms:template:${payload.templateCode || payload.templateName || payload.templateId}:${tenantId || 'global'}`;
      let tpl = await this.cache.get<any>(cacheKey);

      if (!tpl) {
        let query: any = { isActive: true, isDeleted: false, ...tenantFilter };
        if (payload.templateCode) {
          query.code = payload.templateCode.toUpperCase();
        } else if (payload.templateName) {
          query.name = payload.templateName;
        } else {
          query._id = payload.templateId;
        }
        tpl = await Template.findOne(query).lean();
        if (!tpl) {
          throw new NotFoundException(`SMS template not found`);
        }
        await this.cache.set(cacheKey, tpl, this.config.get<number>('cache.ttlSmsTemplate'));
      }

      const rendered = render(tpl.body, payload.variables || {});
      return { message: rendered, template: tpl };
    }
    return { message: payload.message, template: null };
  }

  async sendSms(payload: SendSmsDto, tenantId: string | null): Promise<any> {
    const normalised = normalisePhone(payload.to);
    const { message, template } = await this._resolveTemplate(payload, tenantId);
    const messageId = uuidv4();
    const providerName = this.providers.getProviderName();

    // Idempotency
    if (payload.referenceId) {
      const existing = await this.smsLogModel
        .findOne({ referenceId: payload.referenceId, ...(tenantId ? { tenantId } : {}) })
        .lean();
      if (existing) {
        this.logger.debug(`Duplicate referenceId ${payload.referenceId} — returning cached`);
        return existing;
      }
    }

    const log = await this.smsLogModel.create({
      messageId,
      tenantId,
      to: normalised,
      from: payload.from,
      message,
      messageType: payload.messageType || 'TRANSACTIONAL',
      status: 'QUEUED',
      provider: providerName,
      referenceId: payload.referenceId,
      templateId: template?._id,
      dltTemplateId: payload.dltTemplateId || template?.dltTemplateId,
      dltEntityId: payload.dltEntityId || template?.dltEntityId,
      unicode: payload.unicode || false,
      segmentCount: calculateSegments(message || ''),
      metadata: payload.metadata || {},
      queuedAt: new Date(),
    });

    const provider = this.providers.getProvider();
    let result: any;

    try {
      result = await provider.send({
        to: normalised,
        from: payload.from,
        message,
        unicode: payload.unicode,
        referenceId: payload.referenceId || messageId,
        dltTemplateId: log.dltTemplateId,
        dltEntityId: log.dltEntityId,
        messageType: log.messageType,
        metadata: payload.metadata,
      });
    } catch (err: any) {
      result = { success: false, status: 'FAILED', providerMessageId: null, rawResponse: { error: err.message } };
    }

    const transient = _isTransientError(result);
    const nextStatus = result.success ? 'SENT' : transient ? 'RETRYING' : 'FAILED';

    await this.smsLogModel.findByIdAndUpdate(log._id, {
      $set: {
        status: nextStatus,
        providerMessageId: result.providerMessageId,
        cost: result.cost || 0,
        currency: result.currency || 'INR',
        sentAt: result.success ? new Date() : undefined,
        nextRetryAt: !result.success && transient ? new Date(Date.now() + _retryDelay(0)) : undefined,
      },
      $push: {
        attempts: {
          attemptNumber: 1,
          provider: providerName,
          status: result.success ? 'SENT' : 'FAILED',
          error: result.success ? undefined : result.rawResponse?.error || 'Provider error',
          timestamp: new Date(),
          rawResponse: result.rawResponse,
        },
      },
    });

    // Fallback
    if (!result.success && !transient) {
      const fallback = this.providers.getFallbackProvider();
      if (fallback && fallback.name !== provider.name) {
        this.logger.warn(`Primary failed; trying fallback ${fallback.name}`);
        try {
          const fbResult = await fallback.send({ to: normalised, from: payload.from, message, unicode: payload.unicode, referenceId: messageId });
          if (fbResult.success) {
            await this.smsLogModel.findByIdAndUpdate(log._id, {
              $set: { status: 'SENT', providerMessageId: fbResult.providerMessageId, provider: fallback.name, sentAt: new Date(), fallbackUsed: true },
              $push: { attempts: { attemptNumber: 2, provider: fallback.name, status: 'SENT', timestamp: new Date(), rawResponse: fbResult.rawResponse } },
            });
            result = fbResult;
          }
        } catch (fbErr: any) {
          this.logger.error(`Fallback also failed: ${fbErr.message}`);
        }
      }
    }

    return this.smsLogModel.findById(log._id).lean();
  }

  async sendOtp(payload: any, tenantId: string | null): Promise<any> {
    const OtpStoreModel = getOtpStore();
    const normalised = normalisePhone(payload.to);
    const otpLength = payload.otpLength || 6;
    const expiryMinutes = payload.expiresInMinutes || 10;
    const otp = _generateOtp(otpLength);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60_000);

    // Resolve OTP message template
    let message: string;
    const Template = getSmsTemplate();
    const tenantFilter = tenantId ? { tenantId } : {};

    if (payload.templateCode || payload.templateId) {
      const query: any = { isActive: true, isDeleted: false, ...tenantFilter };
      if (payload.templateCode) query.code = payload.templateCode.toUpperCase();
      else query._id = payload.templateId;
      const tpl = await Template.findOne(query).lean() as any;
      if (tpl) {
        message = render(tpl.body, { otp, ...(payload.variables || {}) });
      } else {
        message = `Your OTP is ${otp}. Valid for ${expiryMinutes} minutes.`;
      }
    } else {
      message = `Your OTP is ${otp}. Valid for ${expiryMinutes} minutes.`;
    }

    // Store OTP
    await OtpStoreModel.findOneAndUpdate(
      { to: normalised, tenantId },
      { to: normalised, tenantId, otp, expiresAt, verified: false, attempts: 0 },
      { upsert: true, new: true },
    );

    // Send SMS
    const smsResult = await this.sendSms({ to: normalised, from: payload.from, message, messageType: 'OTP' }, tenantId);
    return { messageId: smsResult?.messageId, expiresAt, to: normalised };
  }

  async verifyOtp(payload: { to: string; otp: string }, tenantId: string | null): Promise<{ valid: boolean }> {
    const OtpStoreModel = getOtpStore();
    const normalised = normalisePhone(payload.to);
    const record = await OtpStoreModel.findOne({ to: normalised, tenantId }).lean() as any;

    if (!record) return { valid: false };
    if (record.verified) return { valid: false };
    if (new Date() > record.expiresAt) return { valid: false };
    if (record.otp !== payload.otp) {
      await OtpStoreModel.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } });
      return { valid: false };
    }

    await OtpStoreModel.findByIdAndUpdate(record._id, { verified: true });
    return { valid: true };
  }

  async getMessageById(messageId: string, tenantId: string | null): Promise<any> {
    const filter: any = { messageId };
    if (tenantId) filter.tenantId = tenantId;
    const log = await this.smsLogModel.findOne(filter).lean();
    if (!log) throw new NotFoundException(`Message ${messageId} not found`);
    return log;
  }

  async listMessages(query: any, tenantId: string | null): Promise<any> {
    const { page = 1, limit = 20, status, from, to, provider } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter: any = {};
    if (tenantId) filter.tenantId = tenantId;
    if (status) filter.status = status;
    if (provider) filter.provider = provider;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [docs, total] = await Promise.all([
      this.smsLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      this.smsLogModel.countDocuments(filter),
    ]);
    return { data: docs, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
  }

  async purgeMessage(messageId: string, tenantId: string | null): Promise<any> {
    const filter: any = { messageId };
    if (tenantId) filter.tenantId = tenantId;
    const log = await this.smsLogModel.findOneAndUpdate(
      filter,
      { $set: { status: 'PURGED', message: '[REDACTED]', to: '[REDACTED]', gdprPurgedAt: new Date() } },
      { new: true },
    ).lean();
    if (!log) throw new NotFoundException(`Message ${messageId} not found`);
    return log;
  }
}
