import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ScrapeJobEntity } from '../Entities/scrape-job-entity';
import { Repository } from 'typeorm';

@Injectable()
export class ScrapeJobLoggingRepository {
  private readonly logger: Logger = new Logger(ScrapeJobLoggingRepository.name);

  constructor(
    @InjectRepository(ScrapeJobEntity)
    private scrapeJobLoggingRepository: Repository<ScrapeJobEntity>
  ) {}

  async createScrapeJob(): Promise<ScrapeJobEntity> {
    try {
      // Create a new scrape job record with 'in_progress' status.
      const newScrapeJob: ScrapeJobEntity = this.scrapeJobLoggingRepository.create({
        status: 'in_progress',
        started_at: new Date()
      });

      // Save to database.
      const savedJob: ScrapeJobEntity = await this.scrapeJobLoggingRepository.save(newScrapeJob);
      this.logger.log(`Created new scrape job with ID: ${savedJob.id}`);

      return savedJob;
    } catch (error) {
      this.logger.error(`Error creating scrape job record: ${error.message}`);
      throw error;
    }
  }

  async updateScrapeJobCompleted(jobId: number, gpusUpdated: number): Promise<ScrapeJobEntity> {
    try {
      // Find the job by ID.
      const job: ScrapeJobEntity = await this.scrapeJobLoggingRepository.findOne({ where: { id: jobId } });

      if (!job) {
        throw new Error(`Scrape job with ID ${jobId} was not found`);
      }

      // Update the job record.
      job.status = 'completed';
      job.completed_at = new Date();
      job.gpus_updated = gpusUpdated;

      // Save the updated record.
      const updatedJob = await this.scrapeJobLoggingRepository.save(job);
      this.logger.log(`Updated scrape job ${jobId} as completed with ${gpusUpdated} GPUs updated`);

      return updatedJob;
    } catch (error) {
      this.logger.error(`Error updating scrape job as completed: ${error.message}`);
      throw error;
    }
  }

  async updateScrapeJobFailed(jobId: number, errorMessage: string): Promise<ScrapeJobEntity> {
    try {
      // Find the job by ID
      const job = await this.scrapeJobLoggingRepository.findOne({ where: { id: jobId } });

      if (!job) {
        throw new Error(`Scrape job with ID ${jobId} was not found`);
      }

      // Update the job record
      job.status = 'failed';
      job.completed_at = new Date();
      job.error_message = errorMessage;

      // Save the updated record.
      const updatedJob = await this.scrapeJobLoggingRepository.save(job);
      this.logger.log(`Updated scrape job ${jobId} as failed: ${errorMessage}`);

      return updatedJob;
    } catch (error) {
      this.logger.error(`Error updating scrape job as failed: ${error.message}`);
      throw error;
    }
  }

  async getLatestScrapeJobs(limit: number = 10): Promise<ScrapeJobEntity[]> {
    try {
      // Get the most recent scrape jobs
      return this.scrapeJobLoggingRepository.find({
        order: { started_at: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Error retrieving latest scrape jobs: ${error.message}`);
      throw error;
    }
  }
}