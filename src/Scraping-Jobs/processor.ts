import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import {
  LoadAllGPUsWebScrapedService,
  ScrapedStockAvailabilityResponse,
} from './ScrapingServices/gpu-stock-checker-all-web-scraping-service';
import { Job } from 'bull';

@Processor('gpu-scraping')
export class ScrapingJobsProcessor {
  private readonly logger = new Logger(ScrapingJobsProcessor.name);

  constructor(
    private readonly gpuScrapingService: LoadAllGPUsWebScrapedService,
  ) {}

  @Process('scrape-all-gpus')
  async handleScrapingJob(job: Job) {
    this.logger.log(
      `Processing GPU scraping job ${job.id} at ${job.data.timestamp}`,
    );

    try {
      // Update progress to indicate we're starting the job.
      await job.progress(10);

      // Call our existing service to perform the actual scraping.
      const results: ScrapedStockAvailabilityResponse =
        await this.gpuScrapingService.getAllGpuAvailability();

      // Update progress to 100% when complete.
      await job.progress(100);

      this.logger.log(`Scraping job ${job.id} completed successfully`);

      // Return results with metadata.
      return {
        success: true,
        gpusScraped: Object.keys(results).length,
        timestamp: new Date().toISOString(),
        gpuScrapedData: results
      };
    } catch (error) {
      this.logger.error(
        `Error processing scraping job ${job.id}: ${error.message}`,
        error.stack,
      );
      throw error; // Rethrow to trigger Bull's retry mechanism
    }
  }
}
