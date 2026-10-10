import type { ProcessingOutcome, WorkerRunSummary } from './types.js';

export function createRunSummary(workerId: string, startedAt: Date, finishedAt: Date, claimedCount: number, outcomes: ProcessingOutcome[], runId = `run-${startedAt.getTime()}`): WorkerRunSummary {
  const skippedCount = outcomes.filter((outcome) => outcome.errorCode === 'BASELINE_WARMUP' || outcome.errorCode === 'OBSERVATION_DUPLICATE').length;
  const failedCount = outcomes.filter((outcome) => outcome.status === 'failed').length;
  return {
    runId,
    workerId,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: Math.max(0, finishedAt.getTime() - startedAt.getTime()),
    claimedCount,
    completedCount: outcomes.length - failedCount,
    failedCount,
    skippedCount,
  };
}

export function logRunSummary(summary: WorkerRunSummary): void {
  console.info(JSON.stringify({ event: 'worker_run_finished', ...summary }));
}
