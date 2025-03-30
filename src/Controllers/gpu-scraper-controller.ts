import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import {
  GpuStockCheckerServiceBrowserAutomation,
  StockAvailabilityResponse,
} from '../Scraping-Jobs/ScrapingServices/gpu-stock-checker-service-browser-automation-service';
import { LoadAllGpusGpuScrapingService } from '../Scraping-Jobs/ScrapingServices/load-all-gpus-gpu-scraping-service';
import { TrackedGpu, GpuPersistenceService } from '../Services/gpu-persistence.service';
import {
  GpuResult,
  LoadGPUsWebScrapedService,
} from '../Scraping-Jobs/ScrapingServices/gpu-stock-checker-web-scraping-service';
import {
  LoadAllGPUsWebScrapedService,
} from '../Scraping-Jobs/ScrapingServices/gpu-stock-checker-all-web-scraping-service';
import { LoadSpecificGpuDbService, LoadSpecificGpuResponse } from '../Services/load-specific-gpu-db-service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

interface AddGpuRequestResponse {
  message: string;
  sku: string;
}

/* Data Transfer Object for adding a new GPU to the tracking list.
 * Requires both the product URL and a descriptive SKU identifier. */
interface AddGpuRequestBody {
  url: string;
  sku: string;
  price: string;
}

interface GpuAvailabilityRequestBody {
  sku: string;
  province?: string;
  location?: string;
}


export interface LoadGPUListResponse {
  message: string;
  pagesScanned: number;
}

/* Controller handling GPU stock tracking and availability endpoints.
 * Provides functionality to check availability at retail locations, manage tracked GPUs,
 * and add new GPU models to the tracking system. */
@Controller('gpus')
export class GpuScraperController {
  private readonly logger: Logger = new Logger(GpuScraperController.name);

  constructor(
    private readonly gpuStockServiceBrowserAutomation: GpuStockCheckerServiceBrowserAutomation,
    private readonly directApiGpuService: LoadAllGpusGpuScrapingService,
    private readonly gpuPersistenceService: GpuPersistenceService,
    private readonly gpuStockServiceWebScraping: LoadGPUsWebScrapedService,
    private readonly gpuAllStockServiceWebScraping: LoadAllGPUsWebScrapedService,
    private readonly loadSpecificGpuService: LoadSpecificGpuDbService,
    @InjectQueue('gpu-scraping') private readonly scrapingQueue: Queue
  ) {}

  /* Retrieves GPU stock availability using optimized web scraping
   * rather than browser automation for faster results. */
  @Post('scraped')
  async getAvailabilityOptimized(
    @Body() requestBody: AddGpuRequestBody,
  ): Promise<GpuResult[]> {
    try {
      if (!requestBody.url) {
        throw new HttpException(
          'Missing required field: targetURL is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call your new scraping service here.
      return await this.gpuStockServiceWebScraping.getGPUStockInfo(
        requestBody.url,
        requestBody.sku,
      );
    } catch (error) {
      this.logger.error(`Failed to fetch GPU availability: ${error.message}`);
      throw new HttpException(
        'Failed to fetch GPU availability',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('scraped')
  async getAvailabilityScraped(): Promise<any> {
    try {
      // Add a job to the queue instead of calling the service directly.
      const job = await this.scrapingQueue.add(
        'scrape-all-gpus',
        {
          timestamp: new Date().toISOString(),
          triggered: 'api', // Add metadata to identify the source.
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 minute initial delay.
          },
          timeout: 300000, // 5 minutes timeout.
        }
      )

      this.logger.log(`Added scraping job ${job.id} to the queue`);

      // Return job information instead of waiting for scraping results
      return {
        message: 'GPU scraping job queued successfully',
        jobId: job.id,
        status: 'queued',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to queue GPU scraping job: ${error.message}`);
      throw new HttpException(
        'Failed to queue GPU scraping job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* Retrieves real-time GPU stock availability across all retail locations.
   * Executes a browser automationn web scraping operation against Canada Computers for all tracked GPUs.
   * Results are organized by province, location, and SKU. */
  @Get()
  async getAvailability(): Promise<StockAvailabilityResponse> {
    try {
      return await this.gpuStockServiceBrowserAutomation.getGpuAvailability();
    } catch (error) {
      this.logger.error(`Failed to fetch GPU availability: ${error.message}`);
      throw new HttpException(
        'Failed to fetch GPU availability',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Loads in all GPU's scraped from Canada Computers into our apps memory.
  @Get('all')
  async loadEntireGPUListCanadaComputersIntoApp(
    @Query('maxPages') maxPages: string = '5',
  ): Promise<LoadGPUListResponse> {
    try {
      // Convert string to number and ensure it's valid.
      const maxPagesNum: number = parseInt(maxPages, 10) || 5;
      await this.directApiGpuService.getAllGpus(maxPagesNum);

      return {
        message: 'GPUs were loaded into the app successfully',
        pagesScanned: maxPagesNum,
      };
    } catch (error) {
      this.logger.error(`Failed to get GPU list: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve the entire list of GPUs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('loadSpecificGpuFromDb')
  async loadSpecificGpuFromDbByLocation(
    @Body() requestBody: GpuAvailabilityRequestBody
  ): Promise<LoadSpecificGpuResponse> {
    try {
      const { sku, province, location }: GpuAvailabilityRequestBody = requestBody;

      if (!sku || !province || !location) {
        throw new HttpException(
          'SKU, province, and location are all required',
          HttpStatus.BAD_REQUEST,
        );
      }

      return this.loadSpecificGpuService.retrieveGpuFromDb(sku, province, location);
    } catch (error) {
      this.logger.error(`Failed to load specified GPU from the database: ${error.message}`);
      throw new HttpException(
        'Failed to load specified GPU from the database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* Retrieves the current list of all GPU models being tracked by the system.
   * Returns an array containing the SKU identifiers and product URLs. */
  @Get('tracked')
  async getTrackedGpus(): Promise<TrackedGpu[]> {
    try {
      return await this.gpuPersistenceService.getTrackedGpus();
    } catch (error) {
      this.logger.error(`Failed to get tracked GPUs: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve tracked GPUs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* Adds a new GPU model to the tracking system.
   * Requires a product URL and descriptive SKU identifier.
   * Validates input data and prevents duplicate entries. */
  @Post()
  async addGpu(@Body() addGpuDto: AddGpuRequestBody): Promise<AddGpuRequestResponse> {
    try {
      // Validate the input.
      if (!addGpuDto.url || !addGpuDto.sku || !addGpuDto.price) {
        throw new HttpException(
          'Missing required fields: targetURL, price and sku are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.gpuPersistenceService.addGpu(
        addGpuDto.url,
        addGpuDto.sku,
        addGpuDto.price
      );

      const responseBody: AddGpuRequestResponse = {
        message: 'GPU added successfully',
        sku: addGpuDto.sku,
      };

      return responseBody;
    } catch (error) {
      // Check for specific error types to return appropriate status codes.
      if (error.message.includes('already exists')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      } else if (error.message.includes('Missing required fields')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException(
          `Failed to add GPU: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
