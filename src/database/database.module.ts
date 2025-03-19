import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './dbService';
import { DatabaseController } from './dbController';

const dbConfigObj: any = {
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgres',
  database: 'gpu_tracker',
  entities: [],
  synchronize: false, // Set to false in production.
}

@Module({
  imports: [
    TypeOrmModule.forRoot(dbConfigObj),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
  controllers: [DatabaseController],
})

export class DatabaseModule {}