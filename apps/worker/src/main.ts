import { createWorkerClient } from './repository.js';
import { claimAndProcess } from './pipeline.js';

const apiUrl = process.env.STAC_API_URL ?? 'https://earth-search.aws.element84.com/v1/search';
const collection = process.env.STAC_COLLECTION ?? 'sentinel-2-l2a';
const client = createWorkerClient();
const workerId = process.env.WORKER_ID ?? `worker-${process.pid}`;

await claimAndProcess(client, apiUrl, collection, workerId, 50);
