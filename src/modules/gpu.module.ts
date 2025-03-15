import { GpuStockCheckerServiceBrowserAutomation } from '../services/gpu-stock-checker-service-browser-automation.service';
import { GpuScraperController } from '../controllers/gpu-scraper-controller';
import { Module } from '@nestjs/common';
import { LoadAllGpusGpuScrapingService } from '../services/load-all-gpus-gpu-scraping.service';
import { UrlLinksPersistenceService } from '../services/url-links-persistence.service';
import { LoadGPUsWebScrapedService } from '../services/gpu-stock-checker-web-scraping.service';
import { NetworkRequestService } from '../services/network-request.service';
import { LoadAllGPUsWebScrapedService } from "../services/gpu-stock-checker-all-web-scraping.service";

/* Feature module for GPU stock availability tracking functionality.
 * Encapsulates related controllers and services for the GPU tracking system. */
@Module({
  controllers: [GpuScraperController],
  providers: [
    GpuStockCheckerServiceBrowserAutomation,
    LoadAllGpusGpuScrapingService,
    UrlLinksPersistenceService,
    LoadGPUsWebScrapedService,
    NetworkRequestService,
    LoadAllGPUsWebScrapedService
  ],
})
export class GpuModule {}
