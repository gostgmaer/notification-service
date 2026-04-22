import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../../shared/cache/cache.service';
import { SmsLog, SmsLogDocument } from '../schemas/sms-log.schema';

let SmsCampaign: any;
function getCampaignModel(): any {
  if (!SmsCampaign) SmsCampaign = require('../models/SmsCampaign');
  return SmsCampaign;
}

@Injectable()
export class SmsAnalyticsService {
  constructor(
    @InjectModel(SmsLog.name) private readonly smsLogModel: Model<SmsLogDocument>,
    private readonly cache: CacheService,
    private readonly config: ConfigService,
  ) {}

  async getSummary(tenantId: string | null, { from, to }: { from?: string; to?: string } = {}): Promise<any> {
    const cacheKey = `sms:analytics:${tenantId || 'global'}:summary`;
    return this.cache.wrap(cacheKey, async () => {
      const match: any = {};
      if (tenantId) match.tenantId = tenantId;
      if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = new Date(from);
        if (to) match.createdAt.$lte = new Date(to);
      }

      const [summary, byProvider, byStatus] = await Promise.all([
        this.smsLogModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              sent: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
              delivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
              failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
              queued: { $sum: { $cond: [{ $eq: ['$status', 'QUEUED'] }, 1, 0] } },
              retrying: { $sum: { $cond: [{ $eq: ['$status', 'RETRYING'] }, 1, 0] } },
              totalCost: { $sum: '$cost' },
              totalSegments: { $sum: '$segmentCount' },
            },
          },
        ]),
        this.smsLogModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$provider',
              total: { $sum: 1 },
              sent: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
              delivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
              failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
              totalCost: { $sum: '$cost' },
            },
          },
        ]),
        this.smsLogModel.aggregate([
          { $match: match },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ]);

      return {
        summary: summary[0] || { total: 0, sent: 0, delivered: 0, failed: 0, queued: 0, retrying: 0, totalCost: 0 },
        byProvider,
        byStatus,
      };
    }, this.config.get<number>('cache.ttlAnalytics') || 60);
  }

  async getProviderHealth(tenantId: string | null): Promise<any> {
    const match: any = { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60_000) } };
    if (tenantId) match.tenantId = tenantId;

    return this.smsLogModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$provider',
          total: { $sum: 1 },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
          sent: { $sum: { $cond: [{ $in: ['$status', ['SENT', 'DELIVERED']] }, 1, 0] } },
        },
      },
      {
        $project: {
          provider: '$_id',
          total: 1,
          failed: 1,
          sent: 1,
          successRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $divide: ['$sent', '$total'] },
              0,
            ],
          },
          errorRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $divide: ['$failed', '$total'] },
              0,
            ],
          },
        },
      },
    ]);
  }

  async getCampaignStats(campaignId: string, tenantId: string | null): Promise<any> {
    const CampaignModel = getCampaignModel();
    const filter: any = { campaignId };
    if (tenantId) filter.tenantId = tenantId;
    return CampaignModel.findOne(filter).lean();
  }
}
