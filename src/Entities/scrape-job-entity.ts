import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('scrape_jobs')
export class ScrapeJobEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ default: 0 })
  gpus_updated: number;

  @Column({ nullable: true })
  error_message: string;

  @Column({ type: 'bigint', nullable: true })
  new_column: number;
}