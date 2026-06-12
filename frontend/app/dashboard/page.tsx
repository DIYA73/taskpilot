'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { queuesApi, type QueueSummary } from '@/lib/api';

const STATUS_COLORS = {
  waiting: 'text-yellow-400 bg-yellow-400/10',
  active: 'text-blue-400 bg-blue-400/10',
  completed: 'text-green-400 bg-green-400/10',
  failed: 'text-red-400 bg-red-400/10',
  delayed: 'text-purple-400 bg-purple-400/10',
};

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg px-3 py-1.5 text-center ${color}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  );
}

function QueueCard({ queue, onPause, onResume, onClean }: {
  queue: QueueSummary;
  onPause: (name: string) => void;
  onResume: (name: string) => void;
  onClean: (name: string, status: 'completed' | 'failed') => void;
}) {
  const total = queue.waiting + queue.active + queue.completed + queue.failed + queue.delayed;
  const health = total === 0 ? 100 : Math.round(((total - queue.failed) / total) * 100);

  return (
    <div className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Link href={`/queues/${encodeURIComponent(queue.name)}`}
            className="text-white font-semibold text-lg hover:text-violet-400 transition">
            {queue.name}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              queue.paused ? 'bg-yellow-900/50 text-yellow-300' : 'bg-green-900/50 text-green-300'
            }`}>
              {queue.paused ? '⏸ Paused' : '● Running'}
            </span>
            <span className="text-xs text-gray-500">Health: {health}%</span>
          </div>
        </div>
        <div className="flex gap-2">
          {queue.paused ? (
            <button onClick={() => onResume(queue.name)}
              className="text-xs bg-green-800 hover:bg-green-700 text-green-200 px-3 py-1.5 rounded-lg transition">
              Resume
            </button>
          ) : (
            <button onClick={() => onPause(queue.name)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition">
              Pause
            </button>
          )}
          <button onClick={() => onClean(queue.name, 'completed')}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-1.5 rounded-lg transition">
            Clean ✓
          </button>
          <button onClick={() => onClean(queue.name, 'failed')}
            className="text-xs bg-red-900/50 hover:bg-red-900 text-red-400 px-3 py-1.5 rounded-lg transition">
            Clean ✗
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        <StatBadge label="Waiting" value={queue.waiting} color={STATUS_COLORS.waiting} />
        <StatBadge label="Active" value={queue.active} color={STATUS_COLORS.active} />
        <StatBadge label="Done" value={queue.completed} color={STATUS_COLORS.completed} />
        <StatBadge label="Failed" value={queue.failed} color={STATUS_COLORS.failed} />
        <StatBadge label="Delayed" value={queue.delayed} color={STATUS_COLORS.delayed} />
      </div>

      {/* Health bar */}
      <div className="mt-4 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-600 to-green-500 transition-all duration-500"
          style={{ width: `${health}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [queues, setQueues] = useState<QueueSummary[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initial fetch
    queuesApi.list().then(r => setQueues(r.data)).catch(console.error);

    // WebSocket for live updates
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';
    const s = io(wsUrl, { transports: ['websocket'] });
    setSocket(s);

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('queues:update', (data: QueueSummary[]) => {
      setQueues(data);
      setLastUpdate(new Date());
    });

    return () => { s.disconnect(); };
  }, []);

  const handlePause = useCallback(async (name: string) => {
    await queuesApi.pause(name);
  }, []);

  const handleResume = useCallback(async (name: string) => {
    await queuesApi.resume(name);
  }, []);

  const handleClean = useCallback(async (name: string, status: 'completed' | 'failed') => {
    if (!confirm(`Clean all ${status} jobs from "${name}"?`)) return;
    await queuesApi.clean(name, status);
  }, []);

  const totalFailed = queues.reduce((a, q) => a + q.failed, 0);
  const totalActive = queues.reduce((a, q) => a + q.active, 0);
  const totalWaiting = queues.reduce((a, q) => a + q.waiting, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-violet-400">⚡ TaskPilot</span>
          <span className="text-xs text-gray-500">BullMQ Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <span className={`flex items-center gap-1.5 text-xs font-medium ${
            connected ? 'text-green-400' : 'text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {connected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{queues.length}</div>
            <div className="text-sm text-gray-400 mt-1">Total Queues</div>
          </div>
          <div className="bg-gray-900 border border-yellow-900/50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{totalWaiting + totalActive}</div>
            <div className="text-sm text-gray-400 mt-1">Jobs In Progress</div>
          </div>
          <div className="bg-gray-900 border border-red-900/50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{totalFailed}</div>
            <div className="text-sm text-gray-400 mt-1">Failed Jobs</div>
          </div>
        </div>

        {/* Queue list */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Queues</h1>
          <button onClick={() => queuesApi.list().then(r => setQueues(r.data))}
            className="text-sm text-gray-400 hover:text-white transition">
            ↻ Refresh
          </button>
        </div>

        {queues.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-gray-400 text-lg mb-2">No queues found</p>
            <p className="text-gray-600 text-sm">
              Make sure Redis is running and you have BullMQ queues.
            </p>
            <code className="text-xs text-violet-400 bg-violet-900/20 px-3 py-1 rounded mt-3 inline-block">
              REDIS_URL=redis://localhost:6379
            </code>
          </div>
        ) : (
          <div className="space-y-4">
            {queues.map(queue => (
              <QueueCard
                key={queue.name}
                queue={queue}
                onPause={handlePause}
                onResume={handleResume}
                onClean={handleClean}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
