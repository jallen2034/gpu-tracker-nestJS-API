import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { CheerioAPI } from 'cheerio';
import { GpuPersistenceService } from './gpu-persistence.service';
import { NetworkRequestService } from './network-request-service';

interface GPUProduct {
  name: string;
  url: string;
  price: string;
}

@Injectable()
export class LoadAllGpusGpuScrapingService {
  private readonly logger: Logger = new Logger(
    LoadAllGpusGpuScrapingService.name,
  );

  constructor(
    private readonly gpuPersistenceService: GpuPersistenceService,
    private readonly networkRequestService: NetworkRequestService,
  ) {}

  // Extracts GPU product data from HTML content using Cheerio selectors.
  private parseGpuListings(html: string): GPUProduct[] {
    // Initialize Cheerio with the HTML content for DOM manipulation.
    const $: CheerioAPI = cheerio.load(html);

    // Initialize empty array to collect parsed GPU products.
    const products: GPUProduct[] = [];

    // Find all elements with class 'js-product' which represent individual GPU cards.
    $('.js-product').each((i, element) => {
      const name: string = $(element).find('.product-title a').text().trim();
      const url: string =
        $(element).find('.product-title a').attr('href') || '';

      const salePrice: string = $(element).find('.price.sale-price').text().trim();
      const regularPrice: string = $(element).find(`.price.no-sale-price`).text().trim();
      const finalPrice: string = salePrice || regularPrice;

      // Add this GPU's data to our collection.
      products.push({
        name,
        url,
        price: finalPrice
      });
    });

    // Return the complete array of parsed GPU products.
    return products;
  }

  // Fetches and processes all GPU listings from multiple pages, then loads them into the tracker service.
  async getAllGpus(maxPages: number = 5): Promise<void> {
    try {
      const allProducts: GPUProduct[] = [];
      let currentPage: number = 1;

      while (currentPage <= maxPages) {
        // Fetch the current page of GPU listings.
        const html: string =
          await this.networkRequestService.fetchGpuListingsPage(currentPage);

        // Extract product data from the page HTML.
        const products: GPUProduct[] = this.parseGpuListings(html);

        // Exit the loop if no more products found (reached the end of listings).
        if (products.length === 0) {
          break;
        }

        // Add newly found products to our master collection.
        allProducts.push(...products);
        currentPage++;

        // Add delay between requests to prevent rate limiting or IP blocking.
        await this.networkRequestService.delay(300);
      }

      // Register each product with the GPU stock tracker service for monitoring.
      for (let product of allProducts) {
        const { name, url, price }: GPUProduct = product;
        this.gpuPersistenceService.addGpu(url, name, price);
      }
    } catch (error) {
      this.logger.error(
        `Error with getting the entire list of GPUs from Canada computers: ${error}`,
      );
    }
  }
}
