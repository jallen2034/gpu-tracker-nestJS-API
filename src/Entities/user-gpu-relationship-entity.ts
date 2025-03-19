import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Timestamp } from 'typeorm';
import { UsersEntity } from './users-entity';
import { GpusEntity } from './gpus-entity';

@Entity('user_gpu_relationships')
export class UserGpuRelationshipEntity {
  // Establish bidirectional relationships.
  @ManyToOne(() => UsersEntity, users => users.id)
  @JoinColumn({ name: 'user_id' })
  user: UsersEntity;

  @ManyToOne(() => GpusEntity, gpu => gpu.id)
  @JoinColumn({ name: 'gpu_id' })
  gpu: GpusEntity;

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'gpu_id' })
  gpuId: number;

  @Column({ default: true })
  is_tracking: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_threshold: number;

  @Column({ default: false })
  notification_enabled: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp' })
  updated_at: Date;
}