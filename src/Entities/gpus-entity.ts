import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Timestamp } from 'typeorm';
import { GpuAvailabilityEntity } from './gpu-avaliability-entity';

// This Object gets mapped to the Tracked
@Entity('gpus')
export class GpusEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sku: string;

  @Column()
  url: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  msrp: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp' })
  updated_at: Date;

  // Define relations.
  @OneToMany((): typeof  GpuAvailabilityEntity => GpuAvailabilityEntity, availability => availability.gpuId)
  availabilities: GpuAvailabilityEntity[];
}