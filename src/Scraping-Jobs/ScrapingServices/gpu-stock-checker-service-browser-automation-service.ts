import { Injectable, Logger } from '@nestjs/common';
import { Browser, chromium, ElementHandle, Page } from 'playwright';
import {
  TrackedGpu,
  GpuPersistenceService,
} from '../../Services/gpu-persistence.service';

interface Result {
  sku: string;
  province: string;
  location: string;
  quantity: number;
}

interface SkuMap {
  [skuName: string]: Result;
}

interface LocationMap {
  [locationName: string]: SkuMap;
}

export interface StockAvailabilityResponse {
  [provinceName: string]: LocationMap;
}

/* Old GPU Stock Checker Service that uses browser Automation to scrape for GPU availability. This is pretty slow
 * though and I'll be working on a faster service to do the same job as this but with Web Scraping instead. */
@Injectable()
export class GpuStockCheckerServiceBrowserAutomation {
  private readonly logger: Logger = new Logger(
    GpuStockCheckerServiceBrowserAutomation.name,
  );

  constructor(
    private readonly gpuPersistenceService: GpuPersistenceService,
  ) {}

  private isSoldOut(innerHtml: string): boolean {
    return innerHtml.toLowerCase().includes('sold out');
  }

  private async countTotals(page: Page, sku: string): Promise<Result[]> {
    const results: Result[] = [];

    try {
      // Wait for the modal content to be fully loaded.
      await page.waitForSelector('.modal-body', { state: 'attached' });

      // Get all province sections..
      const provinceSections: ElementHandle<SVGElement | HTMLElement>[] =
        await page.$$('.card');

      for (const section of provinceSections) {
        // Get the province name.
        const provinceNameElement = await section.$('.btn-block');
        if (!provinceNameElement) continue;

        const provinceText: string = await provinceNameElement.innerText();
        const province: string = provinceText.trim();

        // Find all store rows within this province section.
        const storeRows: ElementHandle<SVGElement | HTMLElement>[] =
          await section.$$('.row.mx-0.align-items-center');

        for (const row of storeRows) {
          // Get the store name.
          const locationElement = await row.$('.col-3');
          if (!locationElement) continue;

          const location: string = (await locationElement.innerText()).trim();

          // Get the quantity - we need to check if it has inventory.
          const quantityElement = await row.$('.shop-online-box');
          if (!quantityElement) continue;

          const quantityText: string = (
            await quantityElement.innerText()
          ).trim();
          const quantity: number = parseInt(quantityText, 10);

          // Only include stores with stock > 0
          if (quantity > 0) {
            results.push({
              sku,
              province,
              location,
              quantity,
            });
          }
        }
      }

      this.logger.log(`Total locations with stock: ${results.length}`);
      return results;
    } catch (error) {
      this.logger.error('Error in countTotals:', error);
      return [];
    }
  }

  private async expandItemTotalDialogue(page: Page): Promise<any[]> {
    const buttonSelector: string = 'button[data-toggle="collapse"]'; // Selector for the buttons
    const plusIconSelector: string =
      'i.fa-regular.collapse-icon.f-20.position-absolute.right-2.fa-plus'; // The selector for the plus icons
    const results: any[] = [];

    try {
      // Wait for all buttons to be available.
      await page.waitForSelector(buttonSelector, { state: 'attached' });

      // Select all the buttons that toggle the collapses
      const buttons: ElementHandle<SVGElement | HTMLElement>[] =
        await page.$$(buttonSelector);

      if (buttons.length > 0) {
        // Click on each button sequentially to expand the sections.
        for (const button of buttons) {
          await button.click();
          await page.waitForTimeout(500);

          // After expanding the collapse, click the plus icon if it exists.
          const plusIcon: any = await button.$(plusIconSelector);

          if (plusIcon) {
            await plusIcon.click();
          }

          await page.waitForTimeout(500); // Adjust timeout as necessary for the expand action
        }
      }

      return results;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  private displayResults(allResults: Result[][]): StockAvailabilityResponse {
    const hasResults: boolean = allResults.some(
      (resultArr: Result[]): boolean => resultArr.length > 0,
    );

    if (!hasResults) {
      this.logger.log('No stock available :( tough luck iuri');
      return {} as StockAvailabilityResponse;
    }

    const finalResult: StockAvailabilityResponse = {};

    // Build unique list of provinces GPU's were found at.
    allResults.forEach((results: Result[]) => {
      results.forEach((result: Result) => {
        // Initialize a province if needed in our final result.
        if (!(result.province in finalResult)) {
          finalResult[result.province] = {};
        }

        // Initialize location if needed.
        if (!(result.location in finalResult[result.province])) {
          finalResult[result.province][result.location] = {};
        }

        // Add the current GPU by SKU to avoid overwriting.
        finalResult[result.province][result.location][result.sku] = result;
      });
    });

    return finalResult;
  }

  private async checkGpuAvailability(
    page: Page,
    targetUrl: string,
    sku: string,
  ): Promise<Result[]> {
    try {
      // Navigate to the product page
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

      // Check if the product info element exists.
      const innerPElement = await page.$(
        '#storeinfo > div > div > p:nth-child(3)',
      );

      if (!innerPElement) {
        return [];
      }

      // Check if the product is sold out
      const innerHtml: string = await innerPElement.innerHTML();
      const soldOutInStore: boolean = this.isSoldOut(innerHtml);

      if (soldOutInStore) {
        return [];
      }

      // Look for the "Check Other Stores" button.
      const checkOtherStoresElement = await page.$(
        'a[data-target="#checkothertores"] span.link-active',
      );

      if (!checkOtherStoresElement) {
        return [];
      }

      // Click to open the store availability dialog.
      await checkOtherStoresElement.click();
      await this.expandItemTotalDialogue(page);

      // Get stock information from all locations.
      return await this.countTotals(page, sku);
    } catch (error) {
      this.logger.error(`Error checking availability for ${sku}: ${error}`);
      throw error;
    }
  }

  // Main scraping method.
  async getGpuAvailability(): Promise<StockAvailabilityResponse> {
    const availableItems: Result[][] = [];
    const browser: Browser = await chromium.launch({ headless: false });
    const page: Page = await browser.newPage();
    const trackedUrls: TrackedGpu[] =
      await this.gpuPersistenceService.getTrackedGpus();

    try {
      for (const trackedUrl of trackedUrls) {
        const results: Result[] = await this.checkGpuAvailability(
          page,
          trackedUrl.url,
          trackedUrl.sku,
        );

        if (results.length > 0) {
          availableItems.push(results);
        }
      }
    } catch (error) {
      console.error('Unexpected error in getGpuAvailability(): ', error);
      throw error;
    } finally {
      await browser.close();
    }

    return this.displayResults(availableItems);
  }
}
