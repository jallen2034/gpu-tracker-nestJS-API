import { Injectable, Logger } from '@nestjs/common';
import { GpuPersistenceService } from './gpu-persistence.service';
import { GpuRepository } from '../Repositories/gpus-repository';
import { GpuAvailability, GpuAvailabilityRepository } from '../Repositories/gpu-availability-repository';
import { GpusEntity } from '../Entities/gpus-entity';

export interface LoadSpecificGpuResponse {
  success: boolean;
  data: {
    gpu: {
      id: number;
      sku: string;
      url: string;
      msrp: string;
      created_at: string;
      updated_at: string;
    };
    availability: GpuAvailability[];
  };
}

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
      const availabilityData: GpuAvailability[] = await this.gpuAvailabilityRepository.findAvailabilityBySkuAndLocation(
        sku,
        province,
        location
      )

      // Prepare the response.
      return {
        success: true,
        data: {
          gpu: {
            id: gpu.id,
            sku: gpu.sku,
            url: gpu.url,
            msrp: gpu.msrp.toString(),
            created_at: gpu.created_at.toISOString(),
            updated_at: gpu.updated_at.toISOString(),
          },
          availability: availabilityData,
        }
      } as LoadSpecificGpuResponse;
    } catch (error) {
      this.logger.error(`Error with loading a GPU from the service layer: ${error.message}`);
      throw error;
    }
  }
}