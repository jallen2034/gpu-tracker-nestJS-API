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
  private urlLinks: TrackedGpu[] = [];

  getTrackedGpus(): TrackedGpu[] {
    try {
      const trackedGpus = this.urlLinks.map((link: any) => ({
        sku: link.sku,
        url: link.url,
      }));
      return trackedGpus;
    } catch (error) {
      this.logger.error(`Error getting tracked GPUs: ${error.message}`);
      throw error;
    }
  }

  addGpu(url: string, sku: string): void {
    try {
      if (!url || !sku) {
        throw new Error(
          'Missing required fields: targetURL and sku are required',
        );
      }

      // Check if GPU already exists to avoid duplicates.
      const exists: boolean = this.urlLinks.some(
        (gpu: TrackedGpu): boolean => gpu.url === url || gpu.sku === sku,
      );

      if (exists) {
        throw new Error('GPU with this SKU or URL already exists');
      }

      this.urlLinks.push({ url, sku });
      this.logger.log(`Added new GPU to track: ${sku}`);
    } catch (error) {
      this.logger.error(`Error adding GPU: ${error.message}`);
      throw error;
    }
  }
}
