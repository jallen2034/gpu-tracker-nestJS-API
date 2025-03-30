import { GpuStockCheckerServiceBrowserAutomation } from '../Scraping-Jobs/ScrapingServices/gpu-stock-checker-service-browser-automation-service';
import { GpuScraperController } from '../Controllers/gpu-scraper-controller';
import { Module } from '@nestjs/common';
import { LoadAllGpusGpuScrapingService } from '../Scraping-Jobs/ScrapingServices/load-all-gpus-gpu-scraping-service';
import { GpuPersistenceService } from '../Services/gpu-persistence.service';
import { LoadGPUsWebScrapedService } from '../Scraping-Jobs/ScrapingServices/gpu-stock-checker-web-scraping-service';
import { NetworkRequestService } from '../Services/network-request-service';
import { LoadAllGPUsWebScrapedService } from "../Scraping-Jobs/ScrapingServices/gpu-stock-checker-all-web-scraping-service";
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpusEntity } from '../Entities/gpus-entity';
import { GpuAvailabilityEntity } from '../Entities/gpu-avaliability-entity';
import { ScrapeJobEntity } from '../Entities/scrape-job-entity';
import { DatabaseModule } from '../Database/database.module';
import { GpuRepository } from '../Repositories/gpus-repository';
import { GpuAvailabilityRepository } from '../Repositories/gpu-availability-repository';
import { LoadSpecificGpuDbService } from '../Services/load-specific-gpu-db-service';
import { BullModule } from '@nestjs/bull';
import { ScrapingJobsProcessor } from '../Scraping-Jobs/processor';
import { ScrapingJobsScheduler } from '../Scraping-Jobs/scheduler';
import { ScrapeJobLoggingRepository } from '../Repositories/scrape-job-logging-repository';

/* Feature module for GPU stock availability tracking functionality.
 * Encapsulates related controllers and services for the GPU tracking system. */
@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([ GpusEntity, GpuAvailabilityEntity, ScrapeJobEntity]),
    BullModule.registerQueue({
      name: 'gpu-scraping',
    }),
  ],
  controllers: [GpuScraperController],
  providers: [
    GpuStockCheckerServiceBrowserAutomation,
    LoadAllGpusGpuScrapingService,
    GpuPersistenceService,
    LoadGPUsWebScrapedService,
    NetworkRequestService,
    LoadAllGPUsWebScrapedService,
    GpuRepository,
    GpuAvailabilityRepository,
    LoadSpecificGpuDbService,
    ScrapingJobsProcessor,
    ScrapingJobsScheduler,
    ScrapeJobLoggingRepository
  ],
})

export class GpuModule {}
