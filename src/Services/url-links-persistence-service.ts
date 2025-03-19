import { Injectable, Logger } from '@nestjs/common';
import { GpuRepository } from '../Repositories/gpus-repository';
import { GpusEntity } from '../Entities/gpus-entity';

// Define the interface for a tracked GPU
export interface TrackedGpu {
  sku: string;
  url: string;
}

@Injectable()
export class UrlLinksPersistenceService {
  private readonly logger = new Logger(UrlLinksPersistenceService.name);

  constructor(private gpuRepository: GpuRepository) {}

  async getTrackedGpus(): Promise<TrackedGpu[]> {
    try {
      const trackedGpus: GpusEntity[] = await this.gpuRepository.findAll();
      return trackedGpus.map((gpu: GpusEntity) => ({
        sku: gpu.sku,
        url: gpu.url,
        name: gpu.name,
      }));
    } catch (error) {
      this.logger.error(`Error getting tracked GPUs: ${error.message}`);
      throw error;
    }
  }

  async addGpu(url: string, sku: string): Promise<void> {
    try {
      if (!url || !sku) {
        throw new Error(
          'Missing required fields: targetURL and sku are required',
        );
      }

      // Check if GPU already exists
      const existing: GpusEntity = await this.gpuRepository.findBySku(sku);

      if (existing) {
        throw new Error('GPU with this SKU already exists');
      }

      await this.gpuRepository.create({
        sku,
        url
      })

      this.logger.log(`Added new GPU to track: ${sku}`);
    } catch (error) {
      this.logger.error(`Error adding GPU: ${error.message}`);
      throw error;
    }
  }
}
