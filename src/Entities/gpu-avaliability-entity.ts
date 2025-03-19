import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Timestamp } from 'typeorm';
import { GpusEntity } from './gpus-entity';

// Specify the table to map to.
@Entity('gpu_availability')
export class GpuAvailabilityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'gpu_id' })
  gpuId: number;

  // Establish a Bidirectional Relationship between gpus and gpu_availability table.
  @ManyToOne((): typeof GpusEntity => GpusEntity, gpu => gpu.availabilities)
  @JoinColumn({ name: 'gpu_id' })
  gpu: GpusEntity;

  @Column()
  province: string;

  @Column()
  location: string;

  @Column({ default: 0 })
  quantity: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp' })
  updated_at: Date;
}