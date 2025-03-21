import { GpuStockCheckerServiceBrowserAutomation } from '../Services/gpu-stock-checker-service-browser-automation-service';
import { GpuScraperController } from '../Controllers/gpu-scraper-controller';
import { Module } from '@nestjs/common';
import { LoadAllGpusGpuScrapingService } from '../Services/load-all-gpus-gpu-scraping-service';
import { UrlLinksPersistenceService } from '../Services/url-links-persistence-service';
import { LoadGPUsWebScrapedService } from '../Services/gpu-stock-checker-web-scraping-service';
import { NetworkRequestService } from '../Services/network-request-service';
import { LoadAllGPUsWebScrapedService } from "../Services/gpu-stock-checker-all-web-scraping-service";
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpusEntity } from '../Entities/gpus-entity';
import { GpuAvailabilityEntity } from '../Entities/gpu-avaliability-entity';
import { ScrapeJobEntity } from '../Entities/scrape-job-entity';
import { DatabaseModule } from '../Database/database.module';
import { GpuRepository } from '../Repositories/gpus-repository';

/* Feature module for GPU stock availability tracking functionality.
 * Encapsulates related controllers and services for the GPU tracking system. */
@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([ GpusEntity, GpuAvailabilityEntity, ScrapeJobEntity])
  ],
  controllers: [GpuScraperController],
  providers: [
    GpuStockCheckerServiceBrowserAutomation,
    LoadAllGpusGpuScrapingService,
    UrlLinksPersistenceService,
    LoadGPUsWebScrapedService,
    NetworkRequestService,
    LoadAllGPUsWebScrapedService,
    GpuRepository
  ],
})

export class GpuModule {}
