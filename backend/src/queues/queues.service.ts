import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

export interface QueueSummary {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);
  private queues = new Map<string, Queue>();
  private redisUrl: string;

  constructor(private config: ConfigService) {
    this.redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
  }

  private getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const q = new Queue(name, { connection: { url: this.redisUrl } });
      this.queues.set(name, q);
    }
    return this.queues.get(name)!;
  }

  async discoverQueues(): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require('ioredis');
    const client = new Redis(this.redisUrl) as import('ioredis').Redis;
    const keys = await client.keys('bull:*:meta');
    await client.quit();
    return keys.map((k) => k.replace('bull:', '').replace(':meta', ''));
  }

  async getQueueSummaries(): Promise<QueueSummary[]> {
    const names = await this.discoverQueues();
    const summaries = await Promise.all(
      names.map(async (name) => {
        try {
          const q = this.getQueue(name);
          const [waiting, active, completed, failed, delayed] = await Promise.all([
            q.getWaitingCount(),
            q.getActiveCount(),
            q.getCompletedCount(),
            q.getFailedCount(),
            q.getDelayedCount(),
          ]);
          const isPaused = await q.isPaused();
          return { name, waiting, active, completed, failed, delayed, paused: isPaused };
        } catch {
          return { name, waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: false };
        }
      }),
    );
    return summaries;
  }

  async pauseQueue(name: string) {
    await this.getQueue(name).pause();
    return { message: `Queue ${name} paused` };
  }

  async resumeQueue(name: string) {
    await this.getQueue(name).resume();
    return { message: `Queue ${name} resumed` };
  }

  async cleanQueue(name: string, status: 'completed' | 'failed') {
    await this.getQueue(name).clean(0, 1000, status);
    return { message: `Cleaned ${status} jobs from ${name}` };
  }
}
