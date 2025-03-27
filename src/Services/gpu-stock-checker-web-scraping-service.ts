import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { CheerioAPI } from 'cheerio';
import { NetworkRequestService } from './network-request-service';
import { GpuPersistenceService } from './gpu-persistence.service';

export interface GpuResult {
  location: string;
  quantity: number;
  province: string;
  sku: string;
}

@Injectable()
export class LoadGPUsWebScrapedService {
  private readonly logger: Logger = new Logger(LoadGPUsWebScrapedService.name);

  constructor(
    private readonly networkRequestService: NetworkRequestService,
    private readonly gpuPersistenceService: GpuPersistenceService,
  ) {}

  private parseGpuListingsCheerio(html: string, sku: string): GpuResult[] {
    const storeInventory: GpuResult[] = [];

    const $: CheerioAPI = cheerio.load(html);

    // First, we need to set the modal to be visible (though this isn't strictly necessary for parsing).
    $('#checkothertores').attr('aria-hidden', 'false');

    // Find the modal body.
    const modalBody = $(`.modal-body`);

    // Find all store rows within the modal body.
    const storeRows = modalBody.find(
      '.row.mx-0.align-items-center.col.d-flex.f-18.font-weight-bold',
    );

    // Iterate through every store encountered in the modal and extract out the info for a GPU.
    storeRows.each((i: number, element: any) => {
      const storeLocationName: string = $(element)
        .find('span.col-3')
        .first()
        .text()
        .trim();

      const countElement = $(element).find('span.shop-online-box');
      const countText: string = countElement.text().trim();
      const count: number = parseInt(countText, 10);

      const provinceElement = $(element)
        .closest('.card')
        .find('.card-header button');

      const province: string = provinceElement.text().trim();

      const foundGpuListingInfo: GpuResult = {
        location: storeLocationName,
        quantity: count,
        province: province,
        sku,
      };

      if (!isNaN(count)) {
        storeInventory.push(foundGpuListingInfo);
      }
    });

    return storeInventory;
  }

  async getGPUStockInfo(url: string, sku: string): Promise<GpuResult[]> {
    try {
      const html: string = await this.networkRequestService.fetchPage(url);
      const results: GpuResult[] = this.parseGpuListingsCheerio(html, sku);

      // Persist the availability data if we got results.
      if (results.length > 0) {
        await this.gpuPersistenceService.addGpuAvailability(results);
      }

      /* Todo: Read the available GPU's from the DB after they have been written to give the user
       * a more accurate view of the current state of that in the DB. */
      return results;
    } catch (error) {
      this.logger.error(
        `Error getting GPU stock info for SKU ${sku}: ${error.message}`,
      );
      return [];
    }
  }
}
