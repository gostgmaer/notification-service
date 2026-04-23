import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

let EmailLog: any;
function getEmailLog(): any {
  if (!EmailLog) EmailLog = require('../models/EmailLog');
  return EmailLog;
}

@Injectable()
export class EmailLogService {
  private readonly logger = new Logger(EmailLogService.name);
  private connected = false;

  private buildTenantFilter(tenantId?: string | null): Record<string, unknown> {
    return tenantId ? { tenantId } : {};
  }

  setConnected(val: boolean): void {
    this.connected = val;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async saveLog(data: any): Promise<any> {
    if (!this.connected) return null;
    try {
      const Model = getEmailLog();
      return await Model.create(data);
    } catch (err: any) {
      this.logger.warn(`Failed to save email log: ${err.message}`);
      return null;
    }
  }

  async updateLog(requestId: string, update: any, tenantId?: string | null): Promise<void> {
    if (!this.connected) return;
    try {
      const Model = getEmailLog();
      await Model.findOneAndUpdate({ requestId, ...this.buildTenantFilter(tenantId) }, { $set: update });
    } catch (err: any) {
      this.logger.warn(`Failed to update email log: ${err.message}`);
    }
  }

  async getLogs(
    filters: any,
    options: { limit?: number; skip?: number; sort?: any } = {},
    tenantId?: string | null,
  ): Promise<any> {
    const Model = getEmailLog();
    const query: any = { ...this.buildTenantFilter(tenantId) };
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }
    const [docs, total] = await Promise.all([
      Model.find(query)
        .sort(options.sort || { createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 100)
        .lean(),
      Model.countDocuments(query),
    ]);
    return { data: docs, total };
  }

  async getLog(requestId: string, tenantId?: string | null): Promise<any> {
    const Model = getEmailLog();
    return Model.findOne({ requestId, ...this.buildTenantFilter(tenantId) }).lean();
  }

  async getLogByIdempotencyKey(idempotencyKey: string, tenantId?: string | null): Promise<any> {
    const Model = getEmailLog();
    return Model.findOne({ idempotencyKey, ...this.buildTenantFilter(tenantId) }).lean();
  }

  async getStats(tenantId?: string | null): Promise<any> {
    const Model = getEmailLog();
    const stats = await Model.aggregate([
      ...(tenantId ? [{ $match: { tenantId } }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return stats.reduce((acc: any, s: any) => { acc[s._id] = s.count; return acc; }, {});
  }
}
