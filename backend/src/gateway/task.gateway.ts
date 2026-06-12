import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { QueuesService } from '../queues/queues.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(TaskGateway.name);
  private interval: NodeJS.Timeout | null = null;
  private clients = 0;

  constructor(private queuesService: QueuesService) {}

  handleConnection(client: Socket) {
    this.clients++;
    this.logger.log(`Client connected: ${client.id}`);
    if (this.clients === 1) this.startBroadcast();
  }

  handleDisconnect(client: Socket) {
    this.clients = Math.max(0, this.clients - 1);
    this.logger.log(`Client disconnected: ${client.id}`);
    if (this.clients === 0) this.stopBroadcast();
  }

  private startBroadcast() {
    this.interval = setInterval(async () => {
      try {
        const summaries = await this.queuesService.getQueueSummaries();
        this.server.emit('queues:update', summaries);
      } catch (err) {
        this.logger.error('Broadcast error', err);
      }
    }, 2000);
  }

  private stopBroadcast() {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
  }
}
