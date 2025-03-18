import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      if (this.dataSource.isInitialized) {
        console.log('Database connection established successfully!');
      } else {
        console.error('Database connection failed!');
      }
    } catch (error) {
      console.error('Error connecting to database:', error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try to run a simple query
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}