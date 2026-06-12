import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Job } from 'bullmq';

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

export interface JobSummary {
  id: string;
  name: string;
  status: JobStatus;
  data: unknown;
  result: unknown;
  failedReason?: string;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
}

@Injectable()
export class JobsService {
  private queues = new Map<string, Queue>();
  private redisUrl: string;

  constructor(private config: ConfigService) {
    this.redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
  }

  private getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue(name, { connection: { url: this.redisUrl } }));
    }
    return this.queues.get(name)!;
  }

  private mapJob(job: Job, status: JobStatus): JobSummary {
    return {
      id: job.id ?? '',
      name: job.name,
      status,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn ?? undefined,
      finishedOn: job.finishedOn ?? undefined,
    };
  }

  async getJobs(queueName: string, status: JobStatus, page = 0, limit = 20): Promise<JobSummary[]> {
    const q = this.getQueue(queueName);
    const start = page * limit;
    const end = start + limit - 1;
    let jobs: Job[] = [];
    switch (status) {
      case 'waiting': jobs = await q.getWaiting(start, end); break;
      case 'active': jobs = await q.getActive(start, end); break;
      case 'completed': jobs = await q.getCompleted(start, end); break;
      case 'failed': jobs = await q.getFailed(start, end); break;
      case 'delayed': jobs = await q.getDelayed(start, end); break;
    }
    return jobs.map((j) => this.mapJob(j, status));
  }

  async retryJob(queueName: string, jobId: string) {
    const q = this.getQueue(queueName);
    const job = await q.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    await job.retry();
    return { message: `Job ${jobId} retried` };
  }

  async deleteJob(queueName: string, jobId: string) {
    const q = this.getQueue(queueName);
    const job = await q.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    await job.remove();
    return { message: `Job ${jobId} deleted` };
  }

  async getJob(queueName: string, jobId: string): Promise<JobSummary | null> {
    const q = this.getQueue(queueName);
    const job = await q.getJob(jobId);
    if (!job) return null;
    const state = await job.getState();
    return this.mapJob(job, state as JobStatus);
  }
}
