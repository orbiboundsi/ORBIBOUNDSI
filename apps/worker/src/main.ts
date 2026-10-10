import { createWorkerClient } from './repository.js';
import { claimAndProcess } from './pipeline.js';
import { loadWorkerConfig } from './config.js';

const config = loadWorkerConfig();
const client = createWorkerClient();

try {
  await claimAndProcess(client, config.stacApiUrl, config.stacCollection, config.workerId, config.maxAssets, config.staleAfterMinutes);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown worker failure';
  console.error(JSON.stringify({ event: 'worker_run_failed', workerId: config.workerId, error: message }));
  process.exitCode = 1;
}
