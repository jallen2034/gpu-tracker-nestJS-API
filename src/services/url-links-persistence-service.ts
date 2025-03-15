import { Injectable, Logger } from '@nestjs/common';

// Define the interface for a tracked GPU
export interface TrackedGpu {
  sku: string;
  url: string;
}

@Injectable()
export class UrlLinksPersistenceService {
  private readonly logger = new Logger(UrlLinksPersistenceService.name);

  // This will be updated by another Scraper/Script dynamically later and injected into this class when needed with Dependency Injection.
  private urlLinks: any = [];

  getTrackedGpus(): TrackedGpu[] {
    try {
      const trackedGpus = this.urlLinks.map((link: any) => ({
        sku: link.sku,
        url: link.targetURL,
      }));
      return trackedGpus;
    } catch (error) {
      this.logger.error(`Error getting tracked GPUs: ${error.message}`);
      throw error;
    }
  }

  addGpu(targetURL: string, sku: string): void {
    try {
      if (!targetURL || !sku) {
        throw new Error(
          'Missing required fields: targetURL and sku are required',
        );
      }

      // Check if GPU already exists to avoid duplicates.
      const exists = this.urlLinks.some(
        (gpu) => gpu.targetURL === targetURL || gpu.sku === sku,
      );

      if (exists) {
        throw new Error('GPU with this SKU or URL already exists');
      }

      this.urlLinks.push({ targetURL, sku });
      this.logger.log(`Added new GPU to track: ${sku}`);
    } catch (error) {
      this.logger.error(`Error adding GPU: ${error.message}`);
      throw error;
    }
  }
}
