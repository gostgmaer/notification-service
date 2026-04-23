import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../services/email.service';
import { EmailLogService } from '../services/email-log.service';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly emailLogService: EmailLogService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.debug(`Processing email job ${job.id} (${job.name}) attempt ${job.attemptsMade + 1}/${job.opts.attempts}`);

    if (job.name === 'email.send') {
      const { payload } = job.data;
      try {
        const result = await this.emailService.sendEmail(payload);
        await this.emailLogService.updateLog(payload.requestId, {
          status: 'sent',
          messageId: result.messageId,
          sentAt: new Date(),
        }, payload.tenantId ?? null);
        return result;
      } catch (err: any) {
        await this.emailLogService.updateLog(payload.requestId, {
          status: this.emailService.isRetryableSmtpError(err) ? 'retrying' : 'failed',
          error: err.message,
          failedAt: new Date(),
        }, payload.tenantId ?? null);
        throw err; // rethrow so BullMQ applies retry/failure logic
      }
    }

    this.logger.warn(`Unknown email job: ${job.name}`);
    return null;
  }

  /** Job succeeded — removed immediately from queue (removeOnComplete: true) */
  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Email job ${job.id} (${job.name}) completed and removed from queue`);
  }

  /**
   * Job attempt failed.
   * - If attempts remain, BullMQ will retry automatically (exponential backoff).
   * - After all retries exhausted the job is kept for 30 days then auto-purged.
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error): void {
    if (!job) return;
    const attemptsLeft = (job.opts.attempts ?? 1) - job.attemptsMade;
    if (attemptsLeft > 0) {
      this.logger.warn(
        `Email job ${job.id} (${job.name}) failed — retrying (${job.attemptsMade}/${job.opts.attempts}): ${err.message}`,
      );
    } else {
      this.logger.error(
        `Email job ${job.id} (${job.name}) exhausted all ${job.opts.attempts} retries — job stored for 30 days: ${err.message}`,
      );
    }
  }
}
