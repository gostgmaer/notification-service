import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { SmsLog, SmsLogDocument } from '../schemas/sms-log.schema';
import { SmsService } from './sms.service';
import { SmsProvidersService } from '../config/sms-providers.service';
import { SendBulkSmsDto } from '../dto/bulk-sms.dto';
import { NotFoundException } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { normalisePhone } = require('../../../shared/utils/phoneNormalizer');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { render } = require('../services/templateEngine');

let SmsCampaign: any;
let SmsTemplate: any;

function getCampaignModel(): any {
  if (!SmsCampaign) SmsCampaign = require('../models/SmsCampaign');
  return SmsCampaign;
}
function getTemplateModel(): any {
  if (!SmsTemplate) SmsTemplate = require('../models/SmsTemplate');
  return SmsTemplate;
}

const DEFAULT_BATCH = 50;

@Injectable()
export class SmsBulkService {
  private readonly logger = new Logger(SmsBulkService.name);

  constructor(
    @InjectModel(SmsLog.name) private readonly smsLogModel: Model<SmsLogDocument>,
    private readonly smsService: SmsService,
    private readonly providers: SmsProvidersService,
    private readonly config: ConfigService,
  ) {}

  async sendBulk(payload: SendBulkSmsDto, tenantId: string | null): Promise<any> {
    const CampaignModel = getCampaignModel();
    const TemplateModel = getTemplateModel();
    const tenantFilter = tenantId ? { tenantId } : {};

    let template: any = null;
    if (payload.templateCode || payload.templateName || payload.templateId) {
      const query: any = { isActive: true, isDeleted: false, ...tenantFilter };
      if (payload.templateCode) query.code = payload.templateCode.toUpperCase();
      else if (payload.templateName) query.name = payload.templateName;
      else query._id = payload.templateId;
      template = await TemplateModel.findOne(query).lean();
      if (!template) throw new NotFoundException('SMS template not found');
    }

    const campaignId = uuidv4();
    const campaign = await CampaignModel.create({
      campaignId,
      tenantId,
      name: payload.name || `Campaign_${campaignId.slice(0, 8)}`,
      totalCount: payload.recipients.length,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      status: 'RUNNING',
      provider: this.providers.getProviderName(),
    });

    // Process asynchronously — return immediately
    this._processBatches(campaign, payload.recipients, {
      template,
      sharedMessage: payload.message,
      from: payload.from,
      messageType: payload.messageType || 'PROMOTIONAL',
      dltTemplateId: payload.dltTemplateId,
      dltEntityId: payload.dltEntityId,
      batchSize: payload.batchSize || DEFAULT_BATCH,
    }, tenantId).catch((err) => {
      this.logger.error(`Campaign ${campaignId} error: ${err.message}`);
      CampaignModel.findByIdAndUpdate(campaign._id, { $set: { status: 'FAILED' } }).catch(() => {});
    });

    return { campaignId, totalCount: payload.recipients.length, status: 'RUNNING' };
  }

  private async _processBatches(campaign: any, recipients: any[], opts: any, tenantId: string | null): Promise<void> {
    const CampaignModel = getCampaignModel();
    const { template, sharedMessage, from, messageType, dltTemplateId, dltEntityId, batchSize } = opts;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (r: any) => {
          const phone = normalisePhone(r.to);
          const msg = template
            ? render(template.body, { ...(r.variables || {}) })
            : r.message || sharedMessage;
          if (!msg) throw new Error(`No message for recipient ${r.to}`);
          return this.smsService.sendSms({ to: phone, message: msg, from, messageType, dltTemplateId, dltEntityId }, tenantId);
        }),
      );

      let sentInc = 0;
      let failedInc = 0;
      results.forEach((r: any) => {
        if (r.status === 'fulfilled' && r.value?.status === 'SENT') sentInc++;
        else failedInc++;
      });

      await CampaignModel.findByIdAndUpdate(campaign._id, { $inc: { sentCount: sentInc, failedCount: failedInc } });
    }

    await CampaignModel.findByIdAndUpdate(campaign._id, { $set: { status: 'COMPLETED', completedAt: new Date() } });
  }

  async getCampaign(campaignId: string, tenantId: string | null): Promise<any> {
    const CampaignModel = getCampaignModel();
    const filter: any = { campaignId };
    if (tenantId) filter.tenantId = tenantId;
    const c = await CampaignModel.findOne(filter).lean();
    if (!c) throw new NotFoundException(`Campaign ${campaignId} not found`);
    return c;
  }

  async listCampaigns(query: any, tenantId: string | null): Promise<any> {
    const CampaignModel = getCampaignModel();
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter: any = tenantId ? { tenantId } : {};
    const [docs, total] = await Promise.all([
      CampaignModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      CampaignModel.countDocuments(filter),
    ]);
    return { data: docs, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
  }
}
