import { GpuStockCheckerService } from "./gpu-stock-checker.service";
import { GpuTrackerController } from "./gpuTrackerController";
import { Module } from "@nestjs/common";

@Module({
  controllers: [GpuTrackerController],
  providers: [GpuStockCheckerService],
})
export class GpuModule {}