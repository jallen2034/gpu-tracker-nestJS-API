import { DatabaseService } from './dbService';
import { Controller, Get } from '@nestjs/common';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('test')
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const isConnected: boolean = await this.databaseService.testConnection();

    return {
      success: isConnected,
      message: isConnected
        ? 'Successfully connected to the database!'
        : 'Failed to connect to the database',
    };
  }
}