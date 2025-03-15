import { Injectable, Logger } from "@nestjs/common";
import { LoadAllGpusBrowserAutomationService } from "./load-all-gpus-browser-automation.service";

@Injectable()
export class LoadAllGpusScrapedAutomationService {
  private readonly logger: Logger = new Logger(LoadAllGpusScrapedAutomationService.name);
  private baseUrl: string = 'https://www.canadacomputers.com/en';

  constructor(

  ) {
  }
}