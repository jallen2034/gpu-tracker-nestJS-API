import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScrapingJobsScheduler {
  private readonly logger = new Logger(ScrapingJobsScheduler.name);

  constructor(
    @InjectQueue('gpu-scraping') private readonly scrapingQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduleGpuScraping() {
    this.logger.log('Scheduling GPU scraping job');

    await this.scrapingQueue.add(
      'scrape-all-gpus',
      {
        timestamp: new Date().toISOString(),
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute initial delay, then exponential.
        },
        timeout: 300000, // 5 minutes timeout.
        removeOnComplete: 100, // Keep last 100 completed jobs.
        removeOnFail: false, // Keep failed jobs for debugging.
      },
    );
  }
}