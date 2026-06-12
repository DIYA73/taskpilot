'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { queuesApi, type JobSummary } from '@/lib/api';

const STATUSES = ['failed', 'waiting', 'active', 'completed', 'delayed'] as const;
type Status = typeof STATUSES[number];

const STATUS_STYLE: Record<Status, string> = {
  failed: 'text-red-400 bg-red-400/10 border-red-800',
  waiting: 'text-yellow-400 bg-yellow-400/10 border-yellow-800',
  active: 'text-blue-400 bg-blue-400/10 border-blue-800',
  completed: 'text-green-400 bg-green-400/10 border-green-800',
  delayed: 'text-purple-400 bg-purple-400/10 border-purple-800',
};

function JobRow({ job, queueName, onRetry, onDelete }: {
  job: JobSummary;
  queueName: string;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${STATUS_STYLE[job.status as Status] ?? 'text-gray-400 bg-gray-800 border-gray-700'}`}>
          {job.status}
        </span>
        <span className="text-sm font-mono text-gray-300 truncate flex-1">{job.id}</span>
        <span className="text-sm text-white font-medium truncate max-w-[200px]">{job.name}</span>
        <span className="text-xs text-gray-500 shrink-0">
          {new Date(job.timestamp).toLocaleString()}
        </span>
        {job.attemptsMade > 0 && (
          <span className="text-xs text-orange-400 shrink-0">{job.attemptsMade} attempts</span>
        )}
        <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          {job.status === 'failed' && (
            <button
              onClick={() => onRetry(job.id)}
              className="text-xs bg-violet-800 hover:bg-violet-700 text-white px-3 py-1 rounded transition"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => onDelete(job.id)}
            className="text-xs bg-red-900/50 hover:bg-red-900 text-red-400 px-3 py-1 rounded transition"
          >
            Delete
          </button>
        </div>
        <span className="text-gray-600 text-sm">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="border-t border-gray-800 px-4 py-4 space-y-3">
          {job.failedReason && (
            <div>
              <p className="text-xs text-red-400 font-medium mb-1">Error</p>
              <pre className="text-xs text-red-300 bg-red-950/30 p-3 rounded overflow-x-auto whitespace-pre-wrap">{job.failedReason}</pre>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Job Data</p>
              <pre className="text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-x-auto">
                {JSON.stringify(job.data, null, 2)}
              </pre>
            </div>
            {job.result !== undefined && job.result !== null && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Result</p>
                <pre className="text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-x-auto">
                  {JSON.stringify(job.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <div className="flex gap-6 text-xs text-gray-500">
            {job.processedOn && <span>Started: {new Date(job.processedOn).toLocaleString()}</span>}
            {job.finishedOn && <span>Finished: {new Date(job.finishedOn).toLocaleString()}</span>}
            {job.processedOn && job.finishedOn && (
              <span>Duration: {job.finishedOn - job.processedOn}ms</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QueuePage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);

  const [status, setStatus] = useState<Status>('failed');
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await queuesApi.jobs(name, status, page);
      setJobs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [name, status, page]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  async function handleRetry(jobId: string) {
    await queuesApi.retryJob(name, jobId);
    loadJobs();
  }

  async function handleDelete(jobId: string) {
    if (!confirm('Delete this job?')) return;
    await queuesApi.deleteJob(name, jobId);
    loadJobs();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 hover:text-white transition text-sm">← Dashboard</Link>
        <span className="text-gray-700">/</span>
        <span className="text-violet-400 font-semibold">{name}</span>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Status tabs */}
        <div className="flex border-b border-gray-800 mb-6">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(0); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px capitalize ${
                status === s ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 pb-2">
            <button onClick={loadJobs} className="text-sm text-gray-400 hover:text-white transition">
              ↻ Refresh
            </button>
            {status === 'failed' && (
              <button
                onClick={async () => {
                  if (!confirm('Retry ALL failed jobs?')) return;
                  for (const job of jobs) await queuesApi.retryJob(name, job.id);
                  loadJobs();
                }}
                className="text-xs bg-violet-700 hover:bg-violet-600 text-white px-3 py-1.5 rounded-lg transition"
              >
                Retry All
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading jobs…</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-gray-400">No {status} jobs</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map(job => (
              <JobRow
                key={job.id}
                job={job}
                queueName={name}
                onRetry={handleRetry}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="text-sm text-gray-400 hover:text-white disabled:opacity-30 transition"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-500">Page {page + 1}</span>
          <button
            disabled={jobs.length < 20}
            onClick={() => setPage(p => p + 1)}
            className="text-sm text-gray-400 hover:text-white disabled:opacity-30 transition"
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  );
}
