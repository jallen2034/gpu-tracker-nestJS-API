import { Injectable, Logger } from '@nestjs/common';
import { GpusEntity } from '../Entities/gpus-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class GpuRepository {
  private readonly logger: Logger = new Logger(GpuRepository.name)

  constructor(
    @InjectRepository(GpusEntity)
    private gpuRepository: Repository<GpusEntity>
  ) {}

  async findAll(): Promise<GpusEntity[]> {
    return this.gpuRepository.find();
  }

  async findOne(id: number): Promise<GpusEntity> {
    return this.gpuRepository.findOneBy({ id });
  }

  async findBySku(sku: string): Promise<GpusEntity> {
    return this.gpuRepository.findOneBy({ sku });
  }

  async create(gpuData: Partial<GpusEntity>): Promise<GpusEntity> {
    const gpuToPersistInDb = {
      ...gpuData,
      created_at: new Date(),
      updated_at: new Date(),
      created: new Date(),
      updated: new Date(),
    }

    const newGpu: GpusEntity = this.gpuRepository.create(gpuToPersistInDb);

    return this.gpuRepository.save(newGpu);
  }

  async update(id: number, gpuData: Partial<GpusEntity>): Promise<void> {
    const gpuToUpdate = {
      ...gpuData,
      updated_at: new Date(),
      updated: new Date(),
    }

    await this.gpuRepository.update(id, gpuToUpdate);
  }

  async remove(id: number): Promise<void> {
    await this.gpuRepository.delete(id);
  }
}