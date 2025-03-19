import { Column, Entity, PrimaryGeneratedColumn, Timestamp } from 'typeorm';

@Entity('users')
export class UsersEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  display_name: string;

  @Column({ nullable: true })
  profile_image_url: string;

  @Column({ nullable: true })
  oauth_provider: string;

  @Column({ nullable: true })
  oauth_id: string;

  @Column({ nullable: true })
  last_login: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp' })
  updated_at: Date;
}