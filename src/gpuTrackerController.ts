import { Controller, Get, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GpuStockCheckerService, StockAvailabilityResponse } from "./gpu-stock-checker.service";

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
export class GpuTrackerController {
  private readonly logger = new Logger(GpuTrackerController.name);

  constructor(private readonly gpuService: GpuStockCheckerService) {
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

  /* Retrieves the current list of all GPU models being tracked by the system.
   * Returns an array containing the SKU identifiers and product URLs. */
  @Get('tracked')
  getTrackedGpus(): { sku: string; url: string; }[] {
    try {
      return this.gpuService.getTrackedGpus();
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

      this.gpuService.addGpu(addGpuDto.targetURL, addGpuDto.sku);

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