import { Module } from '@nestjs/common';
import { GpuModule } from "./gpu/gpu.module";

/* Root application module that serves as the entry point for the NestJS application.
 * This module organizes the application structure by importing feature modules. */
@Module({
  imports: [GpuModule],
})

export class AppModule {}