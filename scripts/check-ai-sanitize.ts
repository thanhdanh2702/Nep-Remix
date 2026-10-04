import assert from 'node:assert/strict';
import { z } from 'zod';
import { sanitizeUserText, toFallbackReason } from '../src/server/ai/sanitize.ts';

// sanitizeUserText
assert.equal(sanitizeUserText('  a\u0000b\n', 80), 'ab');
assert.equal(sanitizeUserText('x\ny\tz', 80), 'x y z');
assert.equal(sanitizeUserText('\u0007\u007f<hi>', 80), '<hi>');
assert.equal(sanitizeUserText('a'.repeat(200), 80).length, 80);
assert.ok(sanitizeUserText('b'.repeat(200)).length <= 80);
assert.equal(sanitizeUserText(undefined, 80), '');
assert.equal(sanitizeUserText(null, 80), '');
assert.equal(sanitizeUserText({ evil: true }, 80), '');
assert.equal(sanitizeUserText(42, 80), '');

// toFallbackReason
assert.equal(toFallbackReason(new DOMException('', 'TimeoutError')), 'timeout');
assert.equal(toFallbackReason(new DOMException('', 'AbortError')), 'timeout');
const zodErr = z.object({ a: z.string() }).safeParse({}).error;
assert.ok(zodErr);
assert.equal(toFallbackReason(zodErr), 'invalid_output');
assert.equal(toFallbackReason(Object.assign(new Error('quota'), { status: 429 })), 'rate_limited');
assert.equal(toFallbackReason(new Error('secret stack detail')), 'ai_unavailable');
assert.equal(toFallbackReason('boom'), 'ai_unavailable');
assert.equal(toFallbackReason(undefined), 'ai_unavailable');

console.log('check-ai-sanitize: OK');
