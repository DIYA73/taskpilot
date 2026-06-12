import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueuesService } from './queues/queues.service';
import { QueuesController } from './queues/queues.controller';
import { JobsService } from './jobs/jobs.service';
import { TaskGateway } from './gateway/task.gateway';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [QueuesService, JobsService, TaskGateway],
  controllers: [QueuesController],
})
export class AppModule {}
