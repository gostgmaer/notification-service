import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SmsAnalyticsService } from '../services/sms-analytics.service';
import { SmsBulkService } from '../services/sms-bulk.service';
import { ApiKeyGuard } from '../../../shared/auth/api-key.guard';

@ApiTags('SMS Analytics')
@ApiBearerAuth('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1/analytics')
export class SmsAnalyticsController {
  constructor(
    private readonly analyticsService: SmsAnalyticsService,
    private readonly bulkService: SmsBulkService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get SMS delivery summary stats' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date' })
  async summary(@Query() query: { from?: string; to?: string }, @Req() req: Request) {
    const data = await this.analyticsService.getSummary(req.tenantId, query);
    return { success: true, data };
  }

  @Get('provider-health')
  @ApiOperation({ summary: 'Get per-provider success/error rates (last 24h)' })
  async providerHealth(@Req() req: Request) {
    const data = await this.analyticsService.getProviderHealth(req.tenantId);
    return { success: true, data };
  }

  @Get('campaigns/:campaignId')
  async campaignStats(@Param('campaignId') campaignId: string, @Req() req: Request) {
    const data = await this.analyticsService.getCampaignStats(campaignId, req.tenantId);
    return { success: true, data };
  }

  @Get('campaigns')
  async listCampaigns(@Query() query: any, @Req() req: Request) {
    const data = await this.bulkService.listCampaigns(query, req.tenantId);
    return { success: true, ...data };
  }

  @Get('campaigns/:campaignId/detail')
  async getCampaign(@Param('campaignId') campaignId: string, @Req() req: Request) {
    const data = await this.bulkService.getCampaign(campaignId, req.tenantId);
    return { success: true, data };
  }
}
