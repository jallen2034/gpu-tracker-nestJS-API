import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from '../Database/database.module';
import { GpuModule } from './gpu.module';
import { ScheduleModule } from '@nestjs/schedule';

/* Root application module that serves as the entry point for the NestJS application.
 * This module organizes the application structure by importing feature modules. */
@Module({
  imports: [
    GpuModule,
    DatabaseModule,
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'gpu-scraping',
    }),
    ScheduleModule.forRoot(),
  ],
})

export class AppModule {}
