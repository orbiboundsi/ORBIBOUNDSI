import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CogReaderError } from '../src/index.js';

test('exposes typed COG errors', () => { const error = new CogReaderError('COG_NO_DATA', 'No valid pixels'); assert.equal(error.code, 'COG_NO_DATA'); assert.equal(error.name, 'CogReaderError'); });
