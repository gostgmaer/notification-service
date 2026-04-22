import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../../shared/cache/cache.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { extractVariables } = require('../services/templateEngine');

let SmsTemplate: any;
function getModel(): any {
  if (!SmsTemplate) SmsTemplate = require('../models/SmsTemplate');
  return SmsTemplate;
}

@Injectable()
export class SmsTemplateService {
  private readonly logger = new Logger(SmsTemplateService.name);

  constructor(
    private readonly cache: CacheService,
    private readonly config: ConfigService,
  ) {}

  async create(body: any, tenantId: string | null): Promise<any> {
    const Model = getModel();
    if (!body.code) {
      body.code = (body.name || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    }
    const tenantFilter = tenantId ? { tenantId } : {};
    const existing = await Model.findOne({ $or: [{ code: body.code, ...tenantFilter }, { name: body.name, ...tenantFilter }] });
    if (existing) {
      const field = existing.code === body.code ? 'code' : 'name';
      throw new ConflictException(`Template with ${field} '${existing[field]}' already exists`);
    }
    const variables = extractVariables(body.body || '');
    return Model.create({ ...body, tenantId, variables });
  }

  async list(query: any, tenantId: string | null): Promise<any> {
    const Model = getModel();
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter: any = { isDeleted: { $ne: true } };
    if (tenantId) filter.tenantId = tenantId;
    const [docs, total] = await Promise.all([
      Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Model.countDocuments(filter),
    ]);
    return { data: docs, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
  }

  async getById(templateId: string, tenantId: string | null): Promise<any> {
    const Model = getModel();
    const filter: any = { _id: templateId, isDeleted: { $ne: true } };
    if (tenantId) filter.tenantId = tenantId;
    const tpl = await Model.findOne(filter).lean();
    if (!tpl) throw new NotFoundException('Template not found');
    return tpl;
  }

  async update(templateId: string, body: any, tenantId: string | null): Promise<any> {
    const Model = getModel();
    const update = { ...body };
    if (update.body) update.variables = extractVariables(update.body);
    const filter: any = { _id: templateId, isDeleted: { $ne: true } };
    if (tenantId) filter.tenantId = tenantId;
    const tpl = await Model.findOneAndUpdate(filter, { $set: update }, { new: true, runValidators: true });
    if (!tpl) throw new NotFoundException('Template not found');
    // Invalidate cache
    await this.cache.del(`sms:template:${tpl.code}:${tenantId || 'global'}`);
    return tpl;
  }

  async remove(templateId: string, tenantId: string | null): Promise<any> {
    const Model = getModel();
    const filter: any = { _id: templateId, isDeleted: { $ne: true } };
    if (tenantId) filter.tenantId = tenantId;
    const tpl = await Model.findOneAndUpdate(
      filter,
      { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } },
      { new: true },
    );
    if (!tpl) throw new NotFoundException('Template not found');
    await this.cache.del(`sms:template:${tpl.code}:${tenantId || 'global'}`);
    return tpl;
  }

  async autoImport(tenantId: string | null): Promise<any> {
    // Import default templates from sample-templates.json if present
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const samples = require('../../../../sample-templates.json');
      const Model = getModel();
      let imported = 0;
      let skipped = 0;
      for (const tpl of samples) {
        try {
          const existing = await Model.findOne({ code: tpl.code, ...(tenantId ? { tenantId } : {}) });
          if (existing) { skipped++; continue; }
          await Model.create({ ...tpl, tenantId });
          imported++;
        } catch { skipped++; }
      }
      return { imported, skipped };
    } catch {
      return { imported: 0, skipped: 0, error: 'No sample templates found' };
    }
  }
}
