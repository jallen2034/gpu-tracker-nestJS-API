import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NetworkRequestService {
  private readonly logger: Logger = new Logger(NetworkRequestService.name);
  private baseUrl: string = 'https://www.canadacomputers.com/en';

  constructor() {}

  // Makes an HTTP GET request with appropriate headers for web scraping
  async fetchPage(url: string, headers?: HeadersInit): Promise<string> {
    try {
      const response: Response = await fetch(
        url,
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

      return await response.text();
    } catch (error) {
      this.logger.error(`Error fetching page at URL ${url}: ${error.message}`);
      throw error;
    }
  }

  async fetchGpuListingsPage(pageNumber: number, headers?: HeadersInit): Promise<string> {
    const url = `${this.baseUrl}/914/graphics-cards?page=${pageNumber}&ajaxtrue=1&onlyproducts=1`;
    return this.fetchPage(url, headers);
  }

  // Creates a timed delay for rate limiting
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}