import { Injectable, Logger } from '@nestjs/common';
import { Job, JobCounts, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScrapingJobsScheduler {
  private readonly logger = new Logger(ScrapingJobsScheduler.name);

  constructor(
    @InjectQueue('gpu-scraping') private readonly scrapingQueue: Queue,
  ) {}

  async getQueueStatus() {
    const counts: JobCounts = await this.scrapingQueue.getJobCounts();
    const waitingJobs: Job<any>[] = await this.scrapingQueue.getWaiting();
    const activeJobs: Job<any>[] = await this.scrapingQueue.getActive();

    this.logger.log(`Queue status: ${JSON.stringify(counts)}`);
    this.logger.log(`Waiting jobs: ${waitingJobs.length}, Active jobs: ${activeJobs.length}`);

    return {
      counts,
      waitingJobs: waitingJobs.map((job: any) => ({
        id: job.id,
        data: job.data,
        timestamp: job.timestamp
      })),
      activeJobs: activeJobs.map((job: any) => ({
        id: job.id,
        data: job.data,
        timestamp: job.timestamp
      }))
    };
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduleGpuScraping() {
    this.logger.log('Scheduling GPU scraping job');

    const job = await this.scrapingQueue.add(
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

    this.logger.log(`Added scraping job ${job.id} to the queue`);

    return job.id
  }
}