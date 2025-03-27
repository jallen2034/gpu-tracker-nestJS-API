import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GpuAvailabilityEntity } from '../Entities/gpu-avaliability-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GpusEntity } from '../Entities/gpus-entity';

export interface GpuAvailability {
  ga_province: string;
  ga_location: string;
  ga_quantity: number;
  g_sku: string;
  g_url: string;
  g_msrp: string;
  gpu_id: number;
  availability_checked: string;
  availability_updated: string;
}

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

  async findAvailabilityBySkuAndLocation(
    sku: string,
    province?: string,
    location?: string,
  ): Promise<GpuAvailability[]> {
    const queryBuilder = this.availabilityRepository
      .createQueryBuilder('ga')
      .innerJoin('ga.gpu', 'g')
      .select([
        'g.id AS gpu_id',
        'g.sku',
        'g.url',
        'g.msrp',
        'ga.province',
        'ga.location',
        'ga.quantity',
        'ga.created_at AS availability_checked',
        'ga.updated_at AS availability_updated',
      ])
      .where('g.sku = :sku', { sku });

    if (province) {
      queryBuilder.andWhere('ga.province = :province', { province });
    }

    if (location) {
      queryBuilder.andWhere('ga.location = :location', { location });
    }

    queryBuilder.orderBy('ga.province')
      .addOrderBy('ga.location')
      .addOrderBy('ga.quantity', 'DESC');

    return queryBuilder.getRawMany();
  }

  async updateOrCreateAvailability(
    gpu: Partial<GpusEntity>,
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