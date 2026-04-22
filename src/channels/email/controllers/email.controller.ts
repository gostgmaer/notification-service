import {
  Controller, Post, Get, Body, Param, Query, Req, HttpCode, HttpStatus, UseGuards, Optional, Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../services/email.service';
import { EmailLogService } from '../services/email-log.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { ApiKeyGuard } from '../../../shared/auth/api-key.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('Email')
@ApiBearerAuth('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1/email')
export class EmailController {
  private readonly bullEnabled: boolean;
  private readonly kafkaEnabled: boolean;
  private readonly emailQueue: any;

  constructor(
    private readonly emailService: EmailService,
    private readonly emailLogService: EmailLogService,
    private readonly config: ConfigService,
    @Optional() @Inject('BullQueue_email') emailQueue: any,
  ) {
    this.emailQueue = emailQueue;
    this.bullEnabled = this.config.get<boolean>('bull.enabled') || false;
    this.kafkaEnabled = this.config.get<boolean>('kafka.enabled') || false;
  }

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send email (queued via BullMQ when ENABLE_BULL=true, idempotent)' })
  @ApiResponse({ status: 202, description: 'Email accepted or queued for delivery' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    type: SendEmailDto,
    examples: {
      order_confirmed: {
        summary: '📦 Order Confirmed',
        value: {
          to: 'john.doe@example.com',
          template: 'ORDER_CONFIRMED',
          data: {
            username: 'John Doe',
            orderId: 'ORD-2026-001',
            totalAmount: '₹1,499.00',
            estimatedDelivery: '2026-04-25T00:00:00.000Z',
            appUrl: 'https://myapp.com',
          },
          idempotencyKey: 'order-ORD-2026-001-confirm',
          applicationName: 'EasyDev',
          appUrl: 'https://myapp.com',
        },
      },
      payment_success: {
        summary: '💰 Payment Success',
        value: {
          to: 'john.doe@example.com',
          template: 'PAYMENT_SUCCESS',
          data: {
            username: 'John Doe',
            amount: '₹1,499.00',
            transactionId: 'TXN-ABC-123456',
            paymentMethod: 'UPI',
            date: '2026-04-22T20:00:00.000Z',
          },
          idempotencyKey: 'payment-TXN-ABC-123456',
        },
      },
      otp: {
        summary: '🔐 OTP / Verification Code',
        value: {
          to: 'john.doe@example.com',
          template: 'otpEmailTemplate',
          data: {
            name: 'John Doe',
            otp: '847291',
            purpose: 'login',
            expiryMinutes: 10,
          },
        },
      },
      welcome: {
        summary: '🎉 Welcome Email',
        value: {
          to: 'john.doe@example.com',
          template: 'welcomeEmailTemplate',
          data: {
            username: 'John Doe',
            appUrl: 'https://myapp.com',
          },
          applicationName: 'EasyDev',
          appUrl: 'https://myapp.com',
          ctaPath: '/dashboard',
        },
      },
      cart_abandoned: {
        summary: '🛒 Abandoned Cart Reminder',
        value: {
          to: 'john.doe@example.com',
          template: 'CART_ABANDONED',
          data: {
            username: 'John Doe',
            cartId: 'CART-789',
            itemCount: 3,
            totalAmount: '₹2,799.00',
            items: [
              { name: 'Wireless Headphones', quantity: 1, price: '₹1,299.00' },
              { name: 'Phone Case', quantity: 2, price: '₹750.00' },
            ],
            abandonedAt: '2026-04-22T18:00:00.000Z',
            appUrl: 'https://myapp.com',
          },
        },
      },
      invoice_generated: {
        summary: '📄 Invoice Generated',
        value: {
          to: 'john.doe@example.com',
          template: 'INVOICE_GENERATED',
          data: {
            username: 'John Doe',
            invoiceNumber: 'INV-2026-042',
            dueDate: '2026-05-01T00:00:00.000Z',
            amount: '₹4,999.00',
            invoiceUrl: 'https://myapp.com/invoices/INV-2026-042',
          },
          idempotencyKey: 'invoice-INV-2026-042',
        },
      },
      subscription_started: {
        summary: '🔄 Subscription Started',
        value: {
          to: 'john.doe@example.com',
          template: 'SUBSCRIPTION_STARTED',
          data: {
            username: 'John Doe',
            subscriptionName: 'Pro Plan',
            startDate: '2026-04-22T00:00:00.000Z',
            appUrl: 'https://myapp.com',
          },
        },
      },
      team_invite: {
        summary: '👥 Team Invite',
        value: {
          to: 'newmember@example.com',
          template: 'TEAM_INVITE',
          data: {
            inviterName: 'Alice Smith',
            teamName: 'Engineering Team',
            inviteUrl: 'https://myapp.com/invite/abc123',
            appUrl: 'https://myapp.com',
          },
        },
      },
      password_reset: {
        summary: '🔑 Password Reset',
        value: {
          to: 'john.doe@example.com',
          template: 'passwordResetRequestTemplate',
          data: {
            username: 'John Doe',
            resetUrl: 'https://myapp.com/reset-password?token=abc123xyz',
            expiryMinutes: 30,
          },
        },
      },
    },
  })
  async sendEmail(@Body() dto: SendEmailDto, @Req() req: Request) {
    const requestId = (req as any).requestId || uuidv4();
    const emailPayload = {
      ...dto,
      requestId,
      timestamp: new Date().toISOString(),
      appContext: req.appContext || {},
    };

    // Idempotency check
    if (emailPayload.idempotencyKey && this.emailLogService.isConnected()) {
      const existing = await this.emailLogService.getLog(`idempotency:${emailPayload.idempotencyKey}`);
      if (existing) {
        return { success: true, message: 'Email already processed', idempotencyKey: emailPayload.idempotencyKey, requestId };
      }
    }

    // Persist initial queued log
    await this.emailLogService.saveLog({ ...emailPayload, status: 'queued', tenantId: req.tenantId });

    if (this.bullEnabled) {
      const job = await this.emailQueue.add('email.send', { payload: emailPayload, tenantId: req.tenantId });
      return { success: true, message: 'Email queued for processing', requestId, jobId: job.id };
    }

    // Direct send
    const result = await this.emailService.sendEmail(emailPayload);
    await this.emailLogService.updateLog(requestId, { status: 'sent', messageId: result.messageId, sentAt: new Date() });

    return { success: true, message: 'Email sent successfully', messageId: result.messageId, requestId };
  }

  @Post('send-sync')
  @ApiOperation({ summary: 'Send email synchronously (waits for SMTP response, no queue)' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiBody({
    type: SendEmailDto,
    examples: {
      otp_sync: {
        summary: '🔐 Send OTP (sync — wait for delivery confirmation)',
        value: {
          to: 'john.doe@example.com',
          template: 'otpEmailTemplate',
          data: {
            name: 'John Doe',
            otp: '391024',
            purpose: 'verification',
            expiryMinutes: 10,
          },
        },
      },
      plain_subject: {
        summary: '✉️ Plain email with custom subject (no template)',
        value: {
          to: 'john.doe@example.com',
          subject: 'Your account has been created',
          data: { name: 'John' },
        },
      },
    },
  })
  async sendEmailSync(@Body() dto: SendEmailDto, @Req() req: Request) {
    const requestId = (req as any).requestId || uuidv4();
    const emailPayload = { ...dto, requestId, appContext: req.appContext || {} };
    const result = await this.emailService.sendEmail(emailPayload);
    await this.emailLogService.updateLog(requestId, { status: 'sent', messageId: result.messageId, sentAt: new Date() });
    return { success: true, message: 'Email sent successfully', messageId: result.messageId, requestId };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get circuit breaker status and email delivery stats' })
  async getMetrics(@Req() req: Request) {
    return {
      circuitBreaker: this.emailService.getCircuitBreakerStatus(),
      smtpConfigured: this.emailService.isSmtpConfigured(),
      database: { connected: this.emailLogService.isConnected() },
      ...(this.emailLogService.isConnected() ? { dbStats: await this.emailLogService.getStats() } : {}),
    };
  }

  @Get('logs')
  @ApiOperation({ summary: 'List email delivery logs with filters' })
  @ApiQuery({ name: 'status', required: false, enum: ['queued', 'sent', 'failed', 'retrying'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getEmailLogs(@Query() query: any, @Req() req: Request) {
    const filters = { status: query.status, startDate: query.startDate, endDate: query.endDate };
    const options = {
      limit: parseInt(query.limit) || 100,
      skip: parseInt(query.skip) || 0,
      sort: query.sort ? (() => { try { return JSON.parse(query.sort); } catch { return { createdAt: -1 }; } })() : { createdAt: -1 },
    };
    const result = await this.emailLogService.getLogs(filters, options);
    return { success: true, ...result };
  }

  @Get('logs/:requestId')
  @ApiOperation({ summary: 'Get a single email log by requestId' })
  async getEmailLog(@Param('requestId') requestId: string) {
    const log = await this.emailLogService.getLog(requestId);
    return { success: true, data: log };
  }

  @Get('health')
  @ApiOperation({ summary: 'Verify SMTP connection health' })
  async healthCheck() {
    const result = await this.emailService.verifyEmailConnection();
    return { success: result.success, ...result };
  }
}
