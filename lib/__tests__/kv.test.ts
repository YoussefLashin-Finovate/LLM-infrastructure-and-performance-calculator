import { describe, it, expect } from 'vitest';
import { getModelArchitecture, calculateKVBytesPerTokenWithGQA } from '../modelArchitectures';

describe('KV cache sizing', () => {
  it('calculates KV bytes per token using layers/heads/dim correctly for 7B int8', () => {
    const arch = getModelArchitecture(7);
    const bytesPerValue = 1; // int8
    const kvBytesPerToken = calculateKVBytesPerTokenWithGQA(arch, bytesPerValue);
    // explicit formula: 2 * L * kvHeads * headDim * bytes
    const headDim = Math.round(arch.hiddenSize / arch.queryHeads);
    const expected = 2 * arch.layers * arch.kvHeads * headDim * bytesPerValue;
    expect(kvBytesPerToken).toBe(expected);
  });

  it('computes reasonable per-user KV at 8k context (approx order of GBs, not tens of GBs)', () => {
    const arch = getModelArchitecture(7);
    const kvBytesPerToken = calculateKVBytesPerTokenWithGQA(arch, 1);
    const ctx = 8192;
    const perUserGB = (kvBytesPerToken * ctx) / 1e9;
    // Expect per-user KV to be < 8 GB (sanity check) and > 0.1 GB
    expect(perUserGB).toBeGreaterThan(0.1);
    expect(perUserGB).toBeLessThan(8);
  });
});