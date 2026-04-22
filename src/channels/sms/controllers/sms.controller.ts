import {
  Controller, Post, Get, Delete, Body, Param, Query, Req, HttpCode, HttpStatus, UseGuards, Optional, Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SmsService } from '../services/sms.service';
import { SmsBulkService } from '../services/sms-bulk.service';
import { SendSmsDto } from '../dto/send-sms.dto';
import { SendBulkSmsDto } from '../dto/bulk-sms.dto';
import { ApiKeyGuard } from '../../../shared/auth/api-key.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('SMS')
@ApiBearerAuth('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1/sms')
export class SmsController {
  private readonly bullEnabled: boolean;
  private readonly smsQueue: any;

  constructor(
    private readonly smsService: SmsService,
    private readonly bulkService: SmsBulkService,
    private readonly config: ConfigService,
    @Optional() @Inject('BullQueue_sms') smsQueue: any,
  ) {
    this.smsQueue = smsQueue;
    this.bullEnabled = this.config.get<boolean>('bull.enabled') || false;
  }

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send an SMS (queued via BullMQ when ENABLE_BULL=true)' })
  @ApiResponse({ status: 202, description: 'SMS accepted for delivery' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async send(@Body() dto: SendSmsDto, @Req() req: Request) {
    if (this.bullEnabled) {
      const job = await this.smsQueue.add('sms.send', { payload: dto, tenantId: req.tenantId });
      return { success: true, data: { jobId: job.id, queued: true } };
    }
    const result = await this.smsService.sendSms(dto, req.tenantId);
    return { success: true, data: result };
  }

  @Post('send-bulk')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send bulk SMS to multiple recipients' })
  @ApiResponse({ status: 202, description: 'Bulk campaign accepted' })
  async sendBulk(@Body() dto: SendBulkSmsDto, @Req() req: Request) {
    if (this.bullEnabled) {
      const job = await this.smsQueue.add('sms.bulk', { payload: dto, tenantId: req.tenantId });
      return { success: true, data: { jobId: job.id, queued: true } };
    }
    const result = await this.bulkService.sendBulk(dto, req.tenantId);
    return { success: true, data: result };
  }

  @Get()
  @ApiOperation({ summary: 'List SMS messages with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async list(@Query() query: any, @Req() req: Request) {
    const result = await this.smsService.listMessages(query, req.tenantId);
    return { success: true, ...result };
  }

  @Get(':messageId')
  @ApiOperation({ summary: 'Get SMS message by ID' })
  async getById(@Param('messageId') messageId: string, @Req() req: Request) {
    const result = await this.smsService.getMessageById(messageId, req.tenantId);
    return { success: true, data: result };
  }

  @Delete(':messageId/gdpr-purge')
  @ApiOperation({ summary: 'GDPR purge — permanently erase PII from an SMS log' })
  @ApiResponse({ status: 200, description: 'PII purged from log' })
  async gdprPurge(@Param('messageId') messageId: string, @Req() req: Request) {
    const result = await this.smsService.purgeMessage(messageId, req.tenantId);
    return { success: true, data: result };
  }
}
