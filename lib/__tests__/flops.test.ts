import { describe, it, expect } from 'vitest';
import { calculateDecodeFlopsPerToken, calculatePrefillFlopsPerToken } from '../calculationParameters/flops';

describe('FLOPs-per-token calculations', () => {
  it('returns ~14 GFLOPS/token for a 7B decoder-only model (theoretical 2× params, CPU)', () => {
    const flops = calculateDecodeFlopsPerToken(7, undefined, 1, undefined, 'cpu');
    expect(flops / 1e9).toBeCloseTo(14.0, 2);
  });

  it('prefill FLOPs/value matches decode baseline by default (CPU)', () => {
    const prefill = calculatePrefillFlopsPerToken(7, undefined, 1, undefined, 'cpu');
    const decode = calculateDecodeFlopsPerToken(7, undefined, 1, undefined, 'cpu');
    expect(prefill).toBeCloseTo(decode, 6);
  });
});