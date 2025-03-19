import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GpuAvailabilityEntity } from '../Entities/gpu-avaliability-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GpusEntity } from '../Entities/gpus-entity';

@Injectable()
export class GpuAvailabilityRepository {
  private readonly logger: Logger = new Logger(GpuAvailabilityRepository.name);

  constructor(
    @InjectRepository(GpuAvailabilityEntity)
    private availabilityRepository: Repository<GpuAvailabilityEntity>,
  ) {}

  async findBuGpuId(gpuId: number): Promise<GpuAvailabilityEntity[]> {
    return this.availabilityRepository.find({
      where: { gpuId },
      order: { created_at: 'ASC' },
    });
  }

  async updateOrCreateAvailability(
    gpu: GpusEntity,
    province: string,
    location: string,
    quantity: number
  ): Promise<GpuAvailabilityEntity> {
    // Look for existing record.
    let availability: GpuAvailabilityEntity = await this.availabilityRepository.findOne({
      where: {
        gpuId: gpu.id,
        province,
        location,
      },
    });

    const now: Date = new Date();

    // If a record exists, update it.
    if (availability) {
      availability.quantity = quantity;
      availability.updated_at = now;

      return this.availabilityRepository.save(availability)
    }

    // Otherwise create a new record.
    availability = this.availabilityRepository.create({
      gpu,
      gpuId: gpu.id,
      province,
      location,
      quantity,
      created_at: now,
      updated_at: now
    });

    return this.availabilityRepository.save(availability);
  }

  async getLatestAvailabilities(): Promise<GpuAvailabilityEntity[]> {
    return this.availabilityRepository.find({
      relations: ['gpu'], // This eagerly loads the related GPU entity
      order: { updated_at: 'DESC' },
    });
  }
}