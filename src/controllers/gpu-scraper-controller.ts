import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, Query } from '@nestjs/common';
import { GpuStockCheckerService, StockAvailabilityResponse } from "../services/gpu-stock-checker.service";
import { LoadAllGpusBrowserAutomationService } from "../services/load-all-gpus-browser-automation.service";
import { UrlLinksPersistenceService } from "../services/url-links-persistence-service";

interface AddGpuRequestResponse { message: string; sku: string; }

/* Data Transfer Object for adding a new GPU to the tracking list.
 * Requires both the product URL and a descriptive SKU identifier. */
interface AddGpuRequestBody {
  targetURL: string;
  sku: string;
}

/* Controller handling GPU stock tracking and availability endpoints.
 * Provides functionality to check availability at retail locations, manage tracked GPUs,
 * and add new GPU models to the tracking system. */
@Controller('gpus')
export class GpuScraperController {
  private readonly logger: Logger = new Logger(GpuScraperController.name);

  constructor(
    private readonly gpuService: GpuStockCheckerService,
    private readonly directApiGpuService: LoadAllGpusBrowserAutomationService,
    private readonly urlLinksPersistenceService: UrlLinksPersistenceService
  ) {}

  @Get('scraped')
  async getAvailabilityOptimized(): Promise<any> {
    try {

    } catch (error) {
      throw new HttpException(
        'Failed to fetch GPU availability',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* Retrieves real-time GPU stock availability across all retail locations.
   * Executes a web scraping operation against Canada Computers for all tracked GPUs.
   * Results are organized by province, location, and SKU. */
  @Get()
  async getAvailability(): Promise<StockAvailabilityResponse> {
    try {
      return await this.gpuService.getGpuAvailability();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch GPU availability',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Gets a list of all the potential GPU's that Canada Computers has by scraping theri site.
  @Get('all')
  async getEntireGPUListCanadaComputers(
    @Query('maxPages') maxPages: string = '5'
  ): Promise<any> {
    try {
      // Convert string to number and ensure it's valid
      const maxPagesNum: number = parseInt(maxPages, 10) || 5;

      await this.directApiGpuService.getAllGpus(maxPagesNum);
      return {
        message: 'GPUs were loaded into the app successfully',
        pagesScanned: maxPagesNum
      };
    } catch (error) {
      this.logger.error(`Failed to get GPU list: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve the entire list of GPUs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* Retrieves the current list of all GPU models being tracked by the system.
   * Returns an array containing the SKU identifiers and product URLs. */
  @Get('tracked')
  getTrackedGpus(): { sku: string; url: string; }[] {
    try {
      return this.urlLinksPersistenceService.getTrackedGpus();
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
  addGpu(@Body() addGpuDto: AddGpuRequestBody): AddGpuRequestResponse {
    try {
      // Validate the input.
      if (!addGpuDto.targetURL || !addGpuDto.sku) {
        throw new HttpException(
          'Missing required fields: targetURL and sku are required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.urlLinksPersistenceService.addGpu(addGpuDto.targetURL, addGpuDto.sku);

      const responseBody: AddGpuRequestResponse = { message: 'GPU added successfully', sku: addGpuDto.sku }
      return responseBody;
    } catch (error) {
      // Check for specific error types to return appropriate status codes.
      if (error.message.includes('already exists')) {
        throw new HttpException(
          error.message,
          HttpStatus.CONFLICT
        );
      } else if (error.message.includes('Missing required fields')) {
        throw new HttpException(
          error.message,
          HttpStatus.BAD_REQUEST
        );
      } else {
        throw new HttpException(
          `Failed to add GPU: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}