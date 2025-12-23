import { describe, it, expect } from 'vitest';
import { calculateLlmInfrastructure } from '../calculations/llmInfrastructure';
import { calculatePerformance } from '../calculations/performance';

describe('Performance / Capacity parity', () => {
  it('calculatePerformance.realistic ≈ calculateLlmInfrastructure.throughputPerUnit for same model & hardware', () => {
    const inputs = {
      modelParams: 13,
      hardwareOps: 1e15, // 1 PFLOPS
      utilization: 0.35,
      inputLength: 100,
      responseLength: 200,
      thinkTime: 5,
      quantType: 'fp16',
      tokensPerSecPerUser: 1
    } as any;

    const perf = calculatePerformance(inputs);

    const rev = calculateLlmInfrastructure({
      modelParams: 13,
      hardwareOpsPerUnit: 1e15,
      utilization: 0.35,
      quantType: 'fp16',
      users: 1,
      tokensPerUser: 1
    } as any);

    // Throughput per unit reported by LLM infra should be in the same order of magnitude as realistic throughput from calculatePerformance
    const a = Number(rev.throughputPerUnit || 0);
    const b = Number(perf.realistic || 0);
    // Allow up to 10x difference in either direction as a sanity check for similar FLOP calculations
    const ratio = b > 0 ? a / b : 0;
    expect(ratio).toBeGreaterThanOrEqual(1/10);
    expect(ratio).toBeLessThanOrEqual(10);
  });
});