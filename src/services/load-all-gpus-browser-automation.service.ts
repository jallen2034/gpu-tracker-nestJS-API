import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { CheerioAPI } from "cheerio";
import { GpuStockCheckerService } from "./gpu-stock-checker.service";
import { UrlLinksPersistenceService } from "./url-links-persistence-service";

interface GPUProduct {
  name: string;
  url: string;
}

@Injectable()
export class LoadAllGpusBrowserAutomationService {
  private readonly logger: Logger = new Logger(LoadAllGpusBrowserAutomationService.name);
  private baseUrl: string = 'https://www.canadacomputers.com/en';

  constructor(
    private readonly gpuStockTrackerService: GpuStockCheckerService,
    private readonly urlLinksPersistenceService: UrlLinksPersistenceService
  ) {}

  // Fetches a single page of GPU listings from Canada Computers using the provided page number.
  private async fetchGpuPage(pageNumber: number, headers?: HeadersInit): Promise<string> {
    try {
      const response: Response = await fetch(
        `${this.baseUrl}/914/graphics-cards?page=${pageNumber}&ajaxtrue=1&onlyproducts=1`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': `${this.baseUrl}/914/graphics-cards`,
            ...headers
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Returns the raw HTML content as a string for further processing.
      return await response.text();
    } catch (error) {
      this.logger.error(`Error fetching GPU page ${pageNumber}: ${error.message}`);
      throw error;
    }
  }

  // Extracts GPU product data from HTML content using Cheerio selectors.
  private parseGpuListings(html: string): GPUProduct[] {
    // Initialize Cheerio with the HTML content for DOM manipulation.
    const $: CheerioAPI = cheerio.load(html);

    // Initialize empty array to collect parsed GPU products.
    const products: GPUProduct[] = [];

    // Find all elements with class 'js-product' which represent individual GPU cards.
    $('.js-product').each((i, element) => {
      // Extract product name from the title element.
      const name: string = $(element).find('.product-title a').text().trim();

      // Extract product URL from the title's anchor href attribute.
      const url: string = $(element).find('.product-title a').attr('href') || '';

      // Add this GPU's data to our collection.
      products.push({
        name,
        url,
      });
    });

    // Return the complete array of parsed GPU products.
    return products;
  }

  // Creates a timed delay to implement rate limiting between requests.
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fetches and processes all GPU listings from multiple pages, then loads them into the tracker service.
  async getAllGpus(maxPages: number = 5): Promise<void> {
    try {
      const allProducts: GPUProduct[] = [];
      let currentPage: number = 1;

      while (currentPage <= maxPages) {
        // Fetch the current page of GPU listings.
        const html: string = await this.fetchGpuPage(currentPage)

        // Extract product data from the page HTML.
        const products: GPUProduct[] = this.parseGpuListings(html);

        // Exit the loop if no more products found (reached the end of listings).
        if (products.length === 0) {
          break;
        }

        // Add newly found products to our master collection.
        allProducts.push(...products)
        currentPage++;

        // Add delay between requests to prevent rate limiting or IP blocking.
        await this.delay(300);
      }

      // Register each product with the GPU stock tracker service for monitoring.
      for (let product of allProducts) {
        const { name, url } = product
        this.urlLinksPersistenceService.addGpu(url, name);
      }
    } catch (error) {
      this.logger.error(`Error with getting the entire list of GPUs from Canada computers: ${error}`);
    }
  }
}