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

  async updateLog(requestId: string, update: any): Promise<void> {
    if (!this.connected) return;
    try {
      const Model = getEmailLog();
      await Model.findOneAndUpdate({ requestId }, { $set: update });
    } catch (err: any) {
      this.logger.warn(`Failed to update email log: ${err.message}`);
    }
  }

  async getLogs(filters: any, options: { limit?: number; skip?: number; sort?: any } = {}): Promise<any> {
    const Model = getEmailLog();
    const query: any = {};
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

  async getLog(requestId: string): Promise<any> {
    const Model = getEmailLog();
    return Model.findOne({ requestId }).lean();
  }

  async getStats(): Promise<any> {
    const Model = getEmailLog();
    const stats = await Model.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return stats.reduce((acc: any, s: any) => { acc[s._id] = s.count; return acc; }, {});
  }
}
