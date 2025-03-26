import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './dbService';
import { DatabaseController } from './dbController';
import { GpusEntity } from '../Entities/gpus-entity';
import { GpuAvailabilityEntity } from '../Entities/gpu-avaliability-entity';
import { UsersEntity } from '../Entities/users-entity';
import { UserGpuRelationshipEntity } from '../Entities/user-gpu-relationship-entity';
import { ScrapeJobEntity } from '../Entities/scrape-job-entity';

// Use proper TypeORM types instead of 'any'
const dbConfigObj = {
  type: 'postgres' as const, // Type assertion to help TypeScript understand this is a literal
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgres',
  database: 'gpu_tracker',
  entities: [GpusEntity, GpuAvailabilityEntity, UsersEntity, UserGpuRelationshipEntity, ScrapeJobEntity],
  synchronize: false, // Set to false in production
};

@Module({
  imports: [
    TypeOrmModule.forRoot(dbConfigObj),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
  controllers: [DatabaseController]
})

export class DatabaseModule {}