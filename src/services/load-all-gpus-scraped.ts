import { Injectable, Logger } from "@nestjs/common";
import { LoadAllGpusGpuScrapingService } from "./load-all-gpus-gpu-scraping.service";

@Injectable()
export class LoadAllGpusScrapedAutomationService {
  private readonly logger: Logger = new Logger(LoadAllGpusScrapedAutomationService.name);
  private baseUrl: string = 'https://www.canadacomputers.com/en';

  constructor(

  ) {
  }
}