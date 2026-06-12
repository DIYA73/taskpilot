import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QueuesService } from './queues.service';
import { JobsService } from '../jobs/jobs.service';
import type { JobStatus } from '../jobs/jobs.service';

@ApiTags('Queues')
@Controller('queues')
export class QueuesController {
  constructor(
    private queuesService: QueuesService,
    private jobsService: JobsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all queues with stats' })
  findAll() {
    return this.queuesService.getQueueSummaries();
  }

  @Post(':name/pause')
  pause(@Param('name') name: string) {
    return this.queuesService.pauseQueue(name);
  }

  @Post(':name/resume')
  resume(@Param('name') name: string) {
    return this.queuesService.resumeQueue(name);
  }

  @Delete(':name/clean/:status')
  clean(@Param('name') name: string, @Param('status') status: 'completed' | 'failed') {
    return this.queuesService.cleanQueue(name, status);
  }

  @Get(':name/jobs')
  @ApiOperation({ summary: 'List jobs in a queue by status' })
  getJobs(
    @Param('name') name: string,
    @Query('status') status = 'failed',
    @Query('page') page = '0',
    @Query('limit') limit = '20',
  ) {
    return this.jobsService.getJobs(name, status as JobStatus, +page, +limit);
  }

  @Get(':name/jobs/:jobId')
  getJob(@Param('name') name: string, @Param('jobId') jobId: string) {
    return this.jobsService.getJob(name, jobId);
  }

  @Post(':name/jobs/:jobId/retry')
  retry(@Param('name') name: string, @Param('jobId') jobId: string) {
    return this.jobsService.retryJob(name, jobId);
  }

  @Delete(':name/jobs/:jobId')
  deleteJob(@Param('name') name: string, @Param('jobId') jobId: string) {
    return this.jobsService.deleteJob(name, jobId);
  }
}
