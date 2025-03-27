import { Injectable, Logger } from '@nestjs/common';
import { GpuRepository } from '../Repositories/gpus-repository';
import { GpusEntity } from '../Entities/gpus-entity';
import { GpuResult } from './gpu-stock-checker-web-scraping-service';
import { GpuAvailabilityRepository } from '../Repositories/gpu-availability-repository';

// Define the interface for a tracked GPU
export interface TrackedGpu {
  sku: string;
  url: string;
  id: any;
  price: any;
}

@Injectable()
export class GpuPersistenceService {
  private readonly logger: Logger = new Logger(GpuPersistenceService.name);

  constructor(
    private gpuRepository: GpuRepository,
    private gpuAvailabilityRepository: GpuAvailabilityRepository,
  ) {}

  private convertPriceStringToNumber(priceString: string): number {
    if (!priceString) {
      return 0;
    }

    // Remove currency symbols, commas, and any non-numeric characters except decimal point.
    const cleanedPrice: string = priceString
      .replace(/[$,]/g, '') // Remove $ and commas.
      .replace(/[^\d.-]/g, '') // Remove any other non-numeric characters (except decimal and negative).
      .trim();

    // Convert to float.
    const price: number = parseFloat(cleanedPrice);

    // Return 0 if result is NaN.
    return isNaN(price) ? 0 : price;
  }

  async getTrackedGpus(): Promise<TrackedGpu[]> {
    try {
      const trackedGpus: GpusEntity[] = await this.gpuRepository.findAll();
      return trackedGpus.map((gpu: GpusEntity) => ({
        sku: gpu.sku,
        url: gpu.url,
        price: gpu.msrp,
        id: gpu.id,
      }));
    } catch (error) {
      this.logger.error(`Error getting tracked GPUs: ${error.message}`);
      throw error;
    }
  }

  // Uses Batch Data Processing to Processing collections of data efficiently with Maps + minimizing database calls.
  async addGpuAvailability(scrapedGpuAvailabilityResult: GpuResult[]) {
    try {
      const allGPUsFromDb: TrackedGpu[] = await this.getTrackedGpus();

      // Key === sku, value = database ID.
      const skuToGpuIdMap: Map<string, number> = new Map();
      const skuToGpuEntityMap: Map<string, Partial<GpusEntity>> = new Map();

      allGPUsFromDb.forEach((gpu: TrackedGpu) => {
        skuToGpuIdMap.set(gpu.sku, gpu.id);

        // Create a GpusEntity object for each GPU.
        const gpuEntity: Partial<GpusEntity> = {
          id: gpu.id,
          sku: gpu.sku,
          url: gpu.url,
          msrp: gpu.price,
          created_at: new Date(),
          updated_at: new Date(),
        };

        skuToGpuEntityMap.set(gpu.sku, gpuEntity);
      });

      this.logger.log(
        `Processing ${scrapedGpuAvailabilityResult.length} GPU availability results`,
      );

      // Process each scraped GPU result.
      for (const scrapedGpuResult of scrapedGpuAvailabilityResult) {
        const { sku, province, location, quantity }: GpuResult = scrapedGpuResult;

        // Check if this GPU exists in our database.
        if (skuToGpuEntityMap.has(sku)) {
          const gpuEntity: Partial<GpusEntity> = skuToGpuEntityMap.get(sku);

          // Now use the repository to create or update the availability record.
          await this.gpuAvailabilityRepository.updateOrCreateAvailability(
            gpuEntity,
            province,
            location,
            quantity,
          );

          this.logger.log(
            `Updated availability for GPU ${sku} at ${location}, ${province}: ${quantity} units`,
          );
        } else {
          this.logger.warn(`GPU with SKU ${sku} not found in database - skipping availability update`);
        }

        this.logger.log('Finished processing GPU availability data');
      }
    } catch (error) {
      this.logger.error(`Error updating GPU availability: ${error.message}`);
      throw error;
    }
  }

  async addGpu(url: string, sku: string, price: string): Promise<void> {
    try {
      if (!url || !sku || !price) {
        throw new Error(
          'Missing required fields: targetURL, sku and a price are required',
        );
      }

      // Check if GPU already exists in the db.
      const existing: GpusEntity = await this.gpuRepository.findBySku(sku);

      if (existing) {
        throw new Error('GPU with this SKU already exists;');
      }

      const numericPrice: number = this.convertPriceStringToNumber(price);

      const gpuToPersistInDb: Partial<GpusEntity> = {
        sku,
        url,
        msrp: numericPrice,
      };

      await this.gpuRepository.create(gpuToPersistInDb);

      this.logger.log(`Added new GPU to track: ${sku}`);
    } catch (error) {
      this.logger.error(`Error adding GPU from the service layer: ${error.message}`);
      throw error;
    }
  }
}
