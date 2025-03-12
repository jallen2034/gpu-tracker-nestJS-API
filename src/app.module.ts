import { Module } from '@nestjs/common';
import { GpuModule } from "./gpu/gpu.module";

@Module({
  imports: [GpuModule],
})

export class AppModule {}