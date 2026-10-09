import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sendAlert } from '../src/index.js';
import type { AlertHistoryRepository, AlertSender } from '../src/index.js';
import type { AnomalyResult } from '@orbibound-ai/anomaly-engine';
const result: AnomalyResult = { riskScore: 86, explanation: 'High anomaly', baselineValue: 1, currentValue: 2, percentChange: 100, zScore: 3 };
const asset = { id: 'a1', assetName: 'Facility', threshold: 75 };
const config = { webhookEnabled: true, emailEnabled: false, emailRecipients: [], webhookUrl: 'https://hooks.example.test/alert' };
function history(existing = false): AlertHistoryRepository { return { exists: async () => existing, insert: async () => undefined }; }
const sender: AlertSender = { send: async () => ({ webhookDelivered: true, emailSent: false, webhookError: null, emailError: null }) };
test('sends and records a threshold breach', async () => { const output = await sendAlert(asset, result, 'scene-1', config, sender, history()); assert.equal(output.webhookDelivered, true); assert.equal(output.duplicate, false); });
test('skips below-threshold result', async () => { const output = await sendAlert(asset, { ...result, riskScore: 50 }, 'scene-1', config, sender, history()); assert.equal(output.webhookDelivered, false); });
test('deduplicates an existing scene alert', async () => { const output = await sendAlert(asset, result, 'scene-1', config, sender, history(true)); assert.equal(output.duplicate, true); });
