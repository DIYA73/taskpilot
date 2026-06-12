# ⚡ TaskPilot

**Modern open-source BullMQ dashboard** — real-time queue monitoring, job management, and one-click retry for Node.js applications.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000?style=flat&logo=nextdotjs)
![BullMQ](https://img.shields.io/badge/BullMQ-FF0000?style=flat)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)

> Think Flower for Celery — but for BullMQ. Beautiful, real-time, TypeScript-native.

---

## Features

- 📊 **Live dashboard** — all queues at a glance (waiting / active / completed / failed / delayed)
- 🔴 **Real-time updates** — WebSocket push, no page refresh needed
- ▶️ **Retry failed jobs** — one click, or retry all at once
- 🗑️ **Delete jobs** — remove individual jobs or clean entire queues
- 🔍 **Job detail** — inspect job data, result, error, attempts, timestamps, duration
- ⏸️ **Pause / Resume** queues
- 📈 **Health bar** — visual queue health per queue
- 🔌 **Zero config** — connects to any Redis instance via `REDIS_URL`

---

## Stack

| Layer | Tech |
|---|---|
| Backend | NestJS + TypeScript |
| Queue engine | BullMQ + ioredis |
| Real-time | Socket.io WebSockets |
| Frontend | Next.js 15 + Tailwind CSS |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Redis running locally

```bash
git clone https://github.com/DIYA73/taskpilot.git
cd taskpilot

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env → set REDIS_URL if not localhost
npm run start:dev

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Configuration

```env
# backend/.env
REDIS_URL=redis://localhost:6379
PORT=3001
```

TaskPilot auto-discovers all BullMQ queues in your Redis instance.

---

## Docker Compose

```bash
docker compose up --build
```

---

## License

MIT
