import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { CacheService } from '../../../shared/cache/cache.service';

const RETRYABLE_SMTP_CODES = new Set([421, 450, 451, 452]);

// Circuit breaker state
enum CBState { CLOSED, OPEN, HALF_OPEN }

class EmailCircuitBreaker {
  private state = CBState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;
  constructor(
    private readonly failureThreshold = 5,
    private readonly resetTimeout = 30_000,
  ) {}
  isAvailable(): boolean {
    if (this.state === CBState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = CBState.HALF_OPEN;
        return true;
      }
      return false;
    }
    return true;
  }
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      if (this.state === CBState.HALF_OPEN) { this.state = CBState.CLOSED; this.failures = 0; }
      return result;
    } catch (err) {
      this.failures++;
      this.lastFailureTime = Date.now();
      if (this.failures >= this.failureThreshold) this.state = CBState.OPEN;
      throw err;
    }
  }
  getStatus() { return { state: CBState[this.state], failures: this.failures }; }
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly templateCache = new Map<string, Function>();
  private readonly circuitBreaker = new EmailCircuitBreaker(5, 30_000);
  private smtpConfigured = false;

  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {}

  onModuleInit(): void {
    try {
      this._initTransporter();
      this.smtpConfigured = true;
    } catch (err: any) {
      this.logger.warn(`SMTP not configured: ${err.message}`);
    }
    this._preloadTemplates();
  }

  private _initTransporter(options: Record<string, any> = {}): void {
    const cfg = this.config.get<any>('email');
    const isGmail = (options.service || cfg.service) === 'gmail';

    const transportConfig: any = {
      ...(options.service || cfg.service ? { service: options.service || cfg.service } : {}),
      host: options.host || cfg.host,
      port: parseInt(options.port) || cfg.port,
      secure: options.secure ?? cfg.secure,
      pool: true,
      maxConnections: cfg.maxConnections,
      maxMessages: cfg.maxMessages,
      rateDelta: cfg.rateDelta,
      rateLimit: cfg.rateLimit,
      tls: {
        rejectUnauthorized: cfg.tlsRejectUnauthorized,
        minVersion: cfg.tlsMinVersion,
      },
      greetingTimeout: 10_000,
      connectionTimeout: 10_000,
      socketTimeout: 30_000,
    };

    if (isGmail && cfg.oauth2.clientId && cfg.oauth2.clientSecret && cfg.oauth2.refreshToken) {
      transportConfig.auth = {
        type: 'OAuth2',
        user: options.user || cfg.user,
        clientId: cfg.oauth2.clientId,
        clientSecret: cfg.oauth2.clientSecret,
        refreshToken: cfg.oauth2.refreshToken,
      };
    } else {
      transportConfig.auth = { user: options.user || cfg.user, pass: options.pass || cfg.pass };
    }

    this.transporter = nodemailer.createTransport(transportConfig);
    this.logger.log(`Email transporter initialized: ${transportConfig.host}:${transportConfig.port}`);
  }

  private _preloadTemplates(): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const templates = require('../templates/emailTemplate');
      let count = 0;
      for (const [name, fn] of Object.entries(templates)) {
        if (typeof fn === 'function') {
          this.templateCache.set(name, fn as Function);
          count++;
        }
      }
      this.logger.log(`Pre-loaded ${count} email templates`);
    } catch (err: any) {
      this.logger.error(`Failed to pre-load templates: ${err.message}`);
    }
  }

  renderTemplate(templateName: string, data: Record<string, unknown>, appContext: Record<string, string> = {}): { subject: string; html: string; text?: string } {
    const cacheKey = `email:template:${templateName}`;
    let templateFn = this.templateCache.get(templateName);

    if (!templateFn) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const templates = require('../templates/emailTemplate');
        templateFn = templates[templateName];
      } catch {
        // ignore
      }
    }

    if (!templateFn) {
      throw new Error(`Email template not found: ${templateName}`);
    }

    const enrichedData = {
      appUrl: appContext.appUrl || process.env.APP_URL || '',
      applicationName: appContext.applicationName || process.env.APPLICATION_NAME || 'Notification Service',
      ctaPath: appContext.ctaPath || null,
      ...data,
    };

    const rendered = templateFn(enrichedData);
    if (!rendered.subject || !rendered.html) {
      throw new Error(`Template ${templateName} must return subject & html`);
    }
    return rendered;
  }

  async sendEmail(payload: any): Promise<{ success: boolean; messageId?: string; accepted?: string[]; rejected?: string[] }> {
    const { to, from, templateId, template, data = {}, appContext = {}, cc, bcc, attachments } = payload;
    const templateName = templateId || template;

    if (!templateName) throw new Error('Either template or templateId must be provided');
    if (!this.transporter) throw new Error('SMTP not configured — set EMAIL_USER and EMAIL_PASS');
    if (!this.circuitBreaker.isAvailable()) throw new Error('Email service temporarily unavailable (circuit open)');

    const { subject, html, text } = this.renderTemplate(templateName, data, appContext);
    const cfg = this.config.get<any>('email');

    const result = await this.circuitBreaker.execute(async () => {
      return this.transporter!.sendMail({
        from: from || (cfg.from.includes('<') ? cfg.from : `${cfg.fromName} <${cfg.from}>`),
        // cfg.from = EMAIL_FROM env var (falls back to EMAIL_USER)
        // cfg.fromName = DEFAULT_FROM_NAME env var (falls back to 'Notifications')
        to,
        subject,
        html,
        text,
        cc,
        bcc,
        attachments,
      });
    });

    return { success: true, messageId: result.messageId, accepted: result.accepted, rejected: result.rejected };
  }

  async verifyEmailConnection(retries = 3, baseDelay = 2000): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.transporter) return { success: false, error: 'Transporter not initialized' };
    for (let i = 0; i < retries; i++) {
      try {
        await this.transporter.verify();
        return { success: true, message: 'Email service is ready' };
      } catch (err: any) {
        if (i === retries - 1) return { success: false, error: err.message };
        await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, i)));
      }
    }
    return { success: false, error: 'Verification failed' };
  }

  isRetryableSmtpError(err: any): boolean {
    return RETRYABLE_SMTP_CODES.has(err?.responseCode);
  }

  getCircuitBreakerStatus() {
    return this.circuitBreaker.getStatus();
  }

  isSmtpConfigured(): boolean {
    return this.smtpConfigured;
  }
}
