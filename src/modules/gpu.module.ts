import { GpuStockCheckerService } from "../services/gpu-stock-checker.service";
import { GpuScraperController } from "../controllers/gpu-scraper-controller";
import { Module } from "@nestjs/common";
import { LoadAllGpusBrowserAutomationService } from "../services/load-all-gpus-browser-automation.service";
import { UrlLinksPersistenceService } from "../services/url-links-persistence-service";

/* Feature module for GPU stock availability tracking functionality.
 * Encapsulates related controllers and services for the GPU tracking system. */
@Module({
  controllers: [GpuScraperController],
  providers: [GpuStockCheckerService, LoadAllGpusBrowserAutomationService, UrlLinksPersistenceService],
})

export class GpuModule {}