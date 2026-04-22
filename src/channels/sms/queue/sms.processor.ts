import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { SmsService } from '../services/sms.service';
import { SmsBulkService } from '../services/sms-bulk.service';

@Processor('sms')
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly bulkService: SmsBulkService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.debug(`Processing SMS job ${job.id} (${job.name}) attempt ${job.attemptsMade + 1}/${job.opts.attempts}`);

    switch (job.name) {
      case 'sms.send':
        return this.smsService.sendSms(job.data.payload, job.data.tenantId ?? null);

      case 'sms.bulk':
        return this.bulkService.sendBulk(job.data.payload, job.data.tenantId ?? null);

      default:
        this.logger.warn(`Unknown SMS job name: ${job.name}`);
        return null;
    }
  }

  /** Job succeeded — removed immediately from queue (removeOnComplete: true) */
  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`SMS job ${job.id} (${job.name}) completed and removed from queue`);
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
        `SMS job ${job.id} (${job.name}) failed — retrying (${job.attemptsMade}/${job.opts.attempts}): ${err.message}`,
      );
    } else {
      this.logger.error(
        `SMS job ${job.id} (${job.name}) exhausted all ${job.opts.attempts} retries — job stored for 30 days: ${err.message}`,
      );
    }
  }
}
