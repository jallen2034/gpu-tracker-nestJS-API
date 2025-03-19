import { Module } from '@nestjs/common';
import { GpuModule } from "./gpu.module";
import { DatabaseModule } from '../Database/database.module';

/* Root application module that serves as the entry point for the NestJS application.
 * This module organizes the application structure by importing feature modules. */
@Module({
  imports: [GpuModule, DatabaseModule],
})

export class AppModule {}