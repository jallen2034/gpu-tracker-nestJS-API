import { GpuStockCheckerService } from "./gpu-stock-checker.service";
import { GpuTrackerController } from "./gpuTrackerController";
import { Module } from "@nestjs/common";

/* Feature module for GPU stock availability tracking functionality.
 * Encapsulates related controllers and services for the GPU tracking system. */
@Module({
  controllers: [GpuTrackerController],
  providers: [GpuStockCheckerService],
})

export class GpuModule {}