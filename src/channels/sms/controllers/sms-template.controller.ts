import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SmsTemplateService } from '../services/sms-template.service';
import { ApiKeyGuard } from '../../../shared/auth/api-key.guard';

@ApiTags('SMS Templates')
@ApiBearerAuth('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1/templates')
export class SmsTemplateController {
  constructor(private readonly templateService: SmsTemplateService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new SMS template' })
  async create(@Body() body: any, @Req() req: Request) {
    const data = await this.templateService.create(body, req.tenantId);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List all SMS templates' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async list(@Query() query: any, @Req() req: Request) {
    const result = await this.templateService.list(query, req.tenantId);
    return { success: true, ...result };
  }

  @Get(':templateId')
  async getById(@Param('templateId') templateId: string, @Req() req: Request) {
    const data = await this.templateService.getById(templateId, req.tenantId);
    return { success: true, data };
  }

  @Put(':templateId')
  async update(@Param('templateId') templateId: string, @Body() body: any, @Req() req: Request) {
    const data = await this.templateService.update(templateId, body, req.tenantId);
    return { success: true, data };
  }

  @Delete(':templateId')
  async remove(@Param('templateId') templateId: string, @Req() req: Request) {
    const data = await this.templateService.remove(templateId, req.tenantId);
    return { success: true, data };
  }

  @Post('import')
  @ApiOperation({ summary: 'Auto-import sample templates from sample-templates.json' })
  async autoImport(@Req() req: Request) {
    const result = await this.templateService.autoImport(req.tenantId);
    return { success: true, data: result };
  }
}
