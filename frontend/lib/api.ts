import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export const api = axios.create({ baseURL: BASE });

export interface QueueSummary {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface JobSummary {
  id: string;
  name: string;
  status: string;
  data: unknown;
  result: unknown;
  failedReason?: string;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
}

export const queuesApi = {
  list: () => api.get<QueueSummary[]>('/queues'),
  pause: (name: string) => api.post(`/queues/${name}/pause`),
  resume: (name: string) => api.post(`/queues/${name}/resume`),
  clean: (name: string, status: 'completed' | 'failed') =>
    api.delete(`/queues/${name}/clean/${status}`),
  jobs: (name: string, status: string, page = 0) =>
    api.get<JobSummary[]>(`/queues/${name}/jobs?status=${status}&page=${page}`),
  retryJob: (name: string, jobId: string) =>
    api.post(`/queues/${name}/jobs/${jobId}/retry`),
  deleteJob: (name: string, jobId: string) =>
    api.delete(`/queues/${name}/jobs/${jobId}`),
};
