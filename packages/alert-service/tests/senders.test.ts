import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AlertError } from '../src/types.js';
import { validateWebhookUrl } from '../src/senders.js';

test('accepts a public HTTPS webhook URL', () => {
  assert.equal(validateWebhookUrl('https://hooks.example.test/events').hostname, 'hooks.example.test');
});

test('rejects non-HTTPS webhook URLs', () => {
  assert.throws(() => validateWebhookUrl('http://hooks.example.test/events'), (error: unknown) => error instanceof AlertError && error.code === 'ALERT_CONFIG_INVALID');
});

test('rejects local and private webhook destinations', () => {
  for (const url of ['https://localhost/hook', 'https://127.0.0.1/hook', 'https://10.0.0.4/hook', 'https://169.254.169.254/latest', 'https://service.internal/hook']) {
    assert.throws(() => validateWebhookUrl(url), (error: unknown) => error instanceof AlertError && error.code === 'ALERT_CONFIG_INVALID');
  }
});

test('rejects webhook credentials', () => {
  assert.throws(() => validateWebhookUrl('https://user:password@hooks.example.test/events'), (error: unknown) => error instanceof AlertError && error.code === 'ALERT_CONFIG_INVALID');
});
