import { GpuStockCheckerService } from "./gpu-stock-checker.service";
import { GpuScraperController } from "./gpu-scraper-controller";
import { Module } from "@nestjs/common";
import { LoadAllGpuService } from "./load-all-gpu.service";

/* Feature module for GPU stock availability tracking functionality.
 * Encapsulates related controllers and services for the GPU tracking system. */
@Module({
  controllers: [GpuScraperController],
  providers: [GpuStockCheckerService, LoadAllGpuService],
})

export class GpuModule {}