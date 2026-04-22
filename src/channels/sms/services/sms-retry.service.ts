import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SmsLog, SmsLogDocument } from '../schemas/sms-log.schema';
import { SmsService } from './sms.service';
import { SmsProvidersService } from '../config/sms-providers.service';

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS = [30_000, 2 * 60_000, 10 * 60_000];

@Injectable()
export class SmsRetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsRetryService.name);
  private handle: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(SmsLog.name) private readonly smsLogModel: Model<SmsLogDocument>,
    private readonly smsService: SmsService,
    private readonly providers: SmsProvidersService,
  ) {}

  onModuleInit(): void {
    this.startRetryWorker();
  }

  onModuleDestroy(): void {
    this.stopRetryWorker();
  }

  startRetryWorker(intervalMs = 60_000): void {
    this.handle = setInterval(() => {
      this.processRetries().catch((err) => this.logger.error(`Retry worker error: ${err.message}`));
    }, intervalMs);
    if (this.handle.unref) this.handle.unref();
    this.logger.log(`Retry worker started (interval: ${intervalMs}ms)`);
  }

  stopRetryWorker(): void {
    if (this.handle) {
      clearInterval(this.handle);
      this.handle = null;
    }
  }

  async processRetries(): Promise<{ retried: number; failed: number }> {
    const due = await this.smsLogModel
      .find({ status: 'RETRYING', nextRetryAt: { $lte: new Date() }, retryCount: { $lt: MAX_ATTEMPTS } })
      .limit(100)
      .lean();

    let retried = 0;
    let failed = 0;

    for (const log of due) {
      try {
        const provider = this.providers.getProvider();
        const result = await provider.send({
          to: log.to,
          from: log.from,
          message: log.message,
          unicode: log.unicode,
          referenceId: log.messageId,
          dltTemplateId: log.dltTemplateId,
          dltEntityId: log.dltEntityId,
        });

        const newAttemptNum = (log.retryCount || 0) + 2;
        const nextCount = (log.retryCount || 0) + 1;
        const isLastAttempt = nextCount >= MAX_ATTEMPTS;

        let nextStatus: string;
        let nextRetryAt: Date | undefined;
        if (result.success) {
          nextStatus = 'SENT';
          retried++;
        } else if (isLastAttempt) {
          nextStatus = 'FAILED';
          failed++;
        } else {
          nextStatus = 'RETRYING';
          nextRetryAt = new Date(Date.now() + RETRY_DELAYS[Math.min(nextCount, RETRY_DELAYS.length - 1)]);
        }

        await this.smsLogModel.findByIdAndUpdate((log as any)._id, {
          $set: {
            status: nextStatus,
            retryCount: nextCount,
            ...(result.success ? { providerMessageId: result.providerMessageId, sentAt: new Date() } : {}),
            ...(nextRetryAt ? { nextRetryAt } : {}),
          },
          $push: {
            attempts: {
              attemptNumber: newAttemptNum,
              provider: this.providers.getProviderName(),
              status: result.success ? 'SENT' : 'FAILED',
              timestamp: new Date(),
              rawResponse: result.rawResponse,
            },
          },
        });
      } catch (err: any) {
        this.logger.warn(`Retry failed for ${log.messageId}: ${err.message}`);
        failed++;
      }
    }

    if (due.length > 0) this.logger.log(`Retry cycle: ${retried} retried, ${failed} failed`);
    return { retried, failed };
  }
}
