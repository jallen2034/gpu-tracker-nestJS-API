import { Injectable, Logger } from '@nestjs/common';
import { GpuPersistenceService } from './gpu-persistence.service';
import { GpuRepository } from '../Repositories/gpus-repository';
import { GpuAvailabilityRepository } from '../Repositories/gpu-availability-repository';
import { GpusEntity } from '../Entities/gpus-entity';

@Injectable()
export class LoadSpecificGpuDbService {
  private readonly logger: Logger = new Logger(GpuPersistenceService.name);

  constructor(
    private gpuRepository: GpuRepository,
    private gpuAvailabilityRepository: GpuAvailabilityRepository,
  ) {}

  async retrieveGpuFromDb(
    sku: string,
    province?: string,
    location?: string,
  ) {
    try {
      this.logger.log(`Retrieving GPU with SKU: ${sku}, province: ${province}, location: ${location}`);

      // We first want to check if the GPu even exists first.
      const gpu: GpusEntity = await this.gpuRepository.findBySku(sku);

      if (!gpu) {
        this.logger.warn(`GPU with SKU ${sku} not found`);
        return {
          success: false,
          message: 'GPU not found',
          data: null
        };
      }

      // Then fetch its availability.
      const availabilityData = await this.gpuAvailabilityRepository.findAvailabilityBySkuAndLocation(
        sku,
        province,
        location
      )

      // Prepare the response.
      return {
        success: true,
        data: {
          gpu,
          availability: availabilityData,
        }
      };
    } catch (error) {
      this.logger.error(`Error with loading a GPU from the service layer: ${error.message}`);
      throw error;
    }
  }
}