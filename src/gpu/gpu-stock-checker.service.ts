// src/gpu/gpu.service.ts - Convert your existing script to a service
import { Injectable, Logger } from '@nestjs/common';
import { Browser, chromium, ElementHandle, Page } from 'playwright';

// Retain your existing interfaces
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

@Injectable()
export class GpuStockCheckerService {
  private readonly logger = new Logger(GpuStockCheckerService.name);

  // This will be updated by another Scraper/Script dynamically later and injected into this class when needed with Dependency Injection.
  private urlLinks: any = [];

  // Helper methods (moved from your script)
  private isSoldOut(innerHtml: string): boolean {
    return innerHtml.toLowerCase().includes('sold out');
  }

  private async countTotals(page: Page, sku: string): Promise<Result[]> {
    const results: Result[] = [];

    try {
      // Wait for the modal content to be fully loaded
      await page.waitForSelector('.modal-body', { state: 'attached' });

      // Get all province sections.
      const provinceSections: ElementHandle<SVGElement | HTMLElement>[] = await page.$$('.card');

      for (const section of provinceSections) {
        // Get the province name.
        const provinceNameElement
          = await section.$('.btn-block');
        if (!provinceNameElement) continue;

        const provinceText: string = await provinceNameElement.innerText();
        const province: string = provinceText.trim();

        // Find all store rows within this province section.
        const storeRows: ElementHandle<SVGElement | HTMLElement>[] = await section.$$('.row.mx-0.align-items-center');

        for (const row of storeRows) {
          // Get the store name.
          const locationElement = await row.$('.col-3');
          if (!locationElement) continue;

          const location: string = (await locationElement.innerText()).trim();

          // Get the quantity - we need to check if it has inventory.
          const quantityElement = await row.$('.shop-online-box');
          if (!quantityElement) continue;

          const quantityText: string = (await quantityElement.innerText()).trim();
          const quantity: number = parseInt(quantityText, 10);

          // Only include stores with stock > 0
          if (quantity > 0) {
            results.push({
              sku,
              province,
              location,
              quantity
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
    const plusIconSelector: string = 'i.fa-regular.collapse-icon.f-20.position-absolute.right-2.fa-plus'; // The selector for the plus icons
    const results: any[] = [];

    try {
      // Wait for all buttons to be available.
      await page.waitForSelector(buttonSelector, { state: 'attached' });

      // Select all the buttons that toggle the collapses
      const buttons: ElementHandle<SVGElement | HTMLElement>[] = await page.$$(buttonSelector);

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
    const hasResults: boolean = allResults.some((
      resultArr: Result[]): boolean => resultArr.length > 0
    );

    if (!hasResults) {
      this.logger.log("No stock available :( tough luck iuri");
      return {} as StockAvailabilityResponse;
    }

    const finalResult: StockAvailabilityResponse = {}

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
      })
    })

    return finalResult
  }

  // Main scraping method.
  async getGpuAvailability(): Promise<StockAvailabilityResponse> {
    const availableItems: Result[][] = [];
    const browser: Browser = await chromium.launch({ headless: false });
    const page: Page = await browser.newPage();

    try {
      for (const url of this.urlLinks) {
        const targetUrl: string = url.targetURL;
        const sku: string = url.sku;

        try {
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

          // Now, target the <p> element inside the #storeinfo div
          const innerPElement = await page.$('#storeinfo > div > div > p:nth-child(3)');

          if (!innerPElement) {
            continue;
          }

          // Get the innerHTML of the <p> element
          const innerHtml: string = await innerPElement.innerHTML();
          const soldOutInStore: boolean = this.isSoldOut(innerHtml);

          if (!soldOutInStore) {
            const checkOtherStoresElement = await page.$('span.link-active'); // Selector for "Check Other Stores"

            if (checkOtherStoresElement) {
              await checkOtherStoresElement.click(); // Click the element to open the counts dialog.
              await this.expandItemTotalDialogue(page);
              const results: Result[] = await this.countTotals(page, sku);
              availableItems.push(results);
            }
          }
        } catch (error) {
          this.logger.error(`Error processing ${sku}: ${error}`);
        }
      }
    } finally {
      await browser.close(); // Make sure the browser is closed even if errors occur
    }

    // Use the display function
    return this.displayResults(availableItems);
  }

  // Add a method to get a list of tracked GPUs.
  getTrackedGpus(): { sku: string; url: string }[] {
    try {
      const trackedGpus = this.urlLinks.map((link: any) => ({
        sku: link.sku,
        url: link.targetURL
      }));
      return trackedGpus
    } catch (error) {
      this.logger.error(`Error getting tracked GPUs: ${error.message}`);
      throw error;
    }
  }

  // Add method to add a new GPU to track.
  addGpu(targetURL: string, sku: string): void {
    try {
      if (!targetURL || !sku) {
        throw new Error('Missing required fields: targetURL and sku are required');
      }

      // Check if GPU already exists to avoid duplicates.
      const exists = this.urlLinks.some(gpu =>
        gpu.targetURL === targetURL || gpu.sku === sku
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