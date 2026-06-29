# ⚡ TaskPilot

**Modern open-source BullMQ dashboard** — real-time queue monitoring, job management, and one-click retry for Node.js applications.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000?style=flat&logo=nextdotjs)
![BullMQ](https://img.shields.io/badge/BullMQ-FF0000?style=flat)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

> Think of it as a production-grade alternative to Bull Board — with live WebSocket updates and a cleaner UI.

---

## Features

- **Live queue stats** — active, waiting, completed, failed job counts update in real time via WebSocket
- **Job management** — inspect job data, logs, and errors; retry failed jobs with one click
- **Queue overview** — monitor multiple queues from a single dashboard
- **WebSocket streaming** — no polling; the dashboard pushes updates as jobs change state
- **Docker ready** — `docker compose up` and you're running

## Tech stack

| Layer    | Technology                    |
|----------|-------------------------------|
| API      | NestJS 10, TypeScript         |
| Queue    | BullMQ + Redis                |
| Realtime | WebSocket gateway (NestJS)    |
| Frontend | Next.js 14, Tailwind CSS      |
| Infra    | Docker Compose                |

## Project structure

```
taskpilot/
├── backend/
│   ├── src/
│   │   ├── queues/       # Queue inspection & management
│   │   ├── jobs/         # Job service (retry, remove)
│   │   └── gateway/      # WebSocket live updates
│   └── .env.example
├── frontend/
│   └── app/
│       ├── dashboard/    # Main dashboard page
│       └── queues/       # Per-queue detail view
└── docker-compose.yml
```

## Quick start

### Prerequisites

- Docker + Docker Compose (recommended)
- Or: Node.js 18+ and a running Redis instance

### Option A — Docker Compose (easiest)

```bash
git clone https://github.com/DIYA73/taskpilot.git
cd taskpilot
docker compose up -d
```

Dashboard available at `http://localhost:3000`.

### Option B — Local development

```bash
git clone https://github.com/DIYA73/taskpilot.git
cd taskpilot

# Configure
cp backend/.env.example backend/.env
# Edit REDIS_URL in backend/.env
```

```env
REDIS_URL=redis://localhost:6379
PORT=3001
```

```bash
# Install
cd backend && npm install
cd ../frontend && npm install

# Run (two terminals)
cd backend && npm run start:dev   # API on :3001
cd frontend && npm run dev        # UI  on :3000
```

## Connect your own queues

TaskPilot connects to your existing Redis instance. Point `REDIS_URL` at the same Redis your application uses and TaskPilot will automatically discover all BullMQ queues.

```env
REDIS_URL=redis://your-redis-host:6379
```

No changes needed in your application code.

## API

```
GET  /queues                  # list all queues with counts
GET  /queues/:name/jobs       # jobs in a queue (with pagination)
GET  /queues/:name/jobs/:id   # single job detail
POST /queues/:name/jobs/:id/retry  # retry a failed job
DELETE /queues/:name/jobs/:id      # remove a job
```

## Contributing

Issues and PRs welcome.

## License

MIT