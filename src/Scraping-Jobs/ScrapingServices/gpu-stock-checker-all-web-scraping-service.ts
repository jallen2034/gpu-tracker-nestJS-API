import { Injectable, Logger } from '@nestjs/common';
import {
  GpuResult,
  LoadGPUsWebScrapedService,
} from './gpu-stock-checker-web-scraping-service';
import {
  GpuPersistenceService,
  TrackedGpu,
} from '../../Services/gpu-persistence.service';
import { NetworkRequestService } from '../../Services/network-request-service';
import { ScrapeJobLoggingRepository } from '../../Repositories/scrape-job-logging-repository';
import { ScrapeJobEntity } from '../../Entities/scrape-job-entity';

interface ScrapedResultMap {
  [skuName: string]: GpuResult;
}

interface ScrapedLocationMap {
  [locationName: string]: ScrapedResultMap;
}

export interface ScrapedStockAvailabilityResponse {
  [provinceName: string]: ScrapedLocationMap;
}

@Injectable()
export class LoadAllGPUsWebScrapedService {
  private readonly logger: Logger = new Logger(
    LoadAllGPUsWebScrapedService.name,
  );

  constructor(
    private readonly gpuStockServiceWebScraping: LoadGPUsWebScrapedService,
    private readonly urlLinksPersistenceService: GpuPersistenceService,
    private readonly networkRequestService: NetworkRequestService,
    private readonly gpuPersistenceService: GpuPersistenceService,
    private readonly scrapeJobLoggingRepository: ScrapeJobLoggingRepository,
  ) {}

  // Transforms raw GpuResult arrays into a structured response by province, location, and SKU.
  private displayResults(
    allResults: GpuResult[][],
  ): ScrapedStockAvailabilityResponse {
    const hasResults: boolean = allResults.some(
      (resultArr: GpuResult[]): boolean => resultArr.length > 0,
    );

    if (!hasResults) {
      this.logger.log('No stock available for any tracked GPUs');
      return {} as ScrapedStockAvailabilityResponse;
    }

    const finalResult: ScrapedStockAvailabilityResponse = {};

    // Build unique list of provinces GPU's were found at.
    allResults.forEach((results: GpuResult[]) => {
      results.forEach((result: GpuResult) => {
        // Initialize a province if needed in our final result.
        if (!(result.province in finalResult)) {
          finalResult[result.province] = {};
        }

        // Initialize location if needed.
        if (!(result.location in finalResult[result.province])) {
          finalResult[result.province][result.location] = {};
        }

        // Add the current GPU by SKU to avoid overwriting.
        finalResult[result.province][result.location][result.sku] = result;
      });
    });

    return finalResult;
  }

  // Fetches stock availability for all tracked GPUs and organizes the results
  async getAllGpuAvailability(): Promise<ScrapedStockAvailabilityResponse> {
    let scrapeJob: ScrapeJobEntity;
    let totalGpusUpdated = 0;

    try {
      // a new scrape job into the database.
      scrapeJob = await this.scrapeJobLoggingRepository.createScrapeJob();

      const apiResponseData: GpuResult[][] = [];
      const allTrackedGpusFromDb: TrackedGpu[] =
        await this.urlLinksPersistenceService.getTrackedGpus();

      this.logger.log(
        `Checking availability for ${allTrackedGpusFromDb.length} tracked GPUs`,
      );

      for (const trackedUrl of allTrackedGpusFromDb) {
        this.logger.log(`Processing GPU: ${trackedUrl.sku}`);

        const results: GpuResult[] =
          await this.gpuStockServiceWebScraping.getGPUStockInfo(
            trackedUrl.url,
            trackedUrl.sku,
          );

        apiResponseData.push(results);

        // Persist the GPU availability data for this scraped GPU into our database.
        if (results.length > 0) {
          await this.gpuPersistenceService.addGpuAvailability(results);
          totalGpusUpdated += results.length;
        }

        // Add delay between requests to prevent rate limiting.
        await this.networkRequestService.delay(500);
      }

      this.logger.log('Finished processing all tracked GPUs');

      // Update the scrape job record as completed
      await this.scrapeJobLoggingRepository.updateScrapeJobCompleted(
        scrapeJob.id,
        totalGpusUpdated
      );

      // Transform the raw data into a structured response.
      return this.displayResults(apiResponseData);
    } catch (error) {
      this.logger.error(
        `Unexpected error in getAllGpuAvailability(): ${error.message}`,
      );

      // If we have a scrape job record, update it as failed
      if (scrapeJob) {
        await this.scrapeJobLoggingRepository.updateScrapeJobFailed(
          scrapeJob.id,
          error.message
        );
      }

      throw error;
    }
  }
}
