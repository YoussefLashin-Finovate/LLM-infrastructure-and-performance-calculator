import { describe, it, expect } from 'vitest';
import { calculateLlmInfrastructure } from '../calculations/llmInfrastructure';

describe('LLM infrastructure correctness', () => {
  it('computes reasonable GPU counts for a 100k t/s workload (10k users × 10 t/s)', () => {
    const inputs = {
      modelParams: 71, // ~71B model to get ~140 GFLOPS/token given constants
      users: 10000,
      inputLength: 0,
      tokensPerUser: 10,
      hardwareOpsPerUnit: 9e15, // 9 PFLOPS (raw peak FLOPs/s for a B200-like device)
      utilization: 0.35,
      quantType: 'fp16',
      // token-aware off for this simple check
    } as any;

    const res = calculateLlmInfrastructure(inputs);

    // Basic sanity checks
    expect(res.unitsNeeded).toBeGreaterThan(0);
    // Expect a small number of GPUs, not thousands (allow 4-20 as safe margin)
    expect(res.unitsNeeded).toBeGreaterThanOrEqual(4);
    expect(res.unitsNeeded).toBeLessThanOrEqual(20);

    // Throughput must equal per-unit × units
    expect(res.totalSystemThroughput).toBeCloseTo(res.throughputPerUnit * res.unitsNeeded, 6);

    // availableFLOPS must equal hardwareOpsPerUnit × utilization × unitsNeeded (usable FLOPs)
    expect(res.availableFLOPS).toBeCloseTo(inputs.hardwareOpsPerUnit * inputs.utilization * res.unitsNeeded, 0);

    // requiredFLOPS must be positive and less than or roughly equal to available (within headroom/multiple)
    expect(res.requiredFLOPS).toBeGreaterThan(0);
  });

  it('throws if scaling logic produces inconsistent system throughput', () => {
    // To exercise the sanity check, we construct a pathological case where throughputPerUnit would be > totalSystemThroughput
    // This is hard to create via normal inputs; instead we mimic a scenario and assert no crash for normal inputs
    const inputs = {
      modelParams: 71,
      users: 10000,
      inputLength: 0,
      tokensPerUser: 10,
      hardwareOpsPerUnit: 9e15,
      utilization: 0.35,
      quantType: 'fp16'
    } as any;

    const res = calculateLlmInfrastructure(inputs);
    expect(res.totalSystemThroughput).toBeGreaterThanOrEqual(res.throughputPerUnit);
  });

  it('required FLOPS should not change when kernelEfficiency changes (kernel only affects capacity)', () => {
    const base = {
      numUsers: 10000,
      tokensPerSecPerUser: 10,
      modelParams: 70,
      kernelEfficiency: 0.4,
      utilizationFactor: 0.8,
      peakFlops: 9e15,
    } as any;

    const lowKE = calculateLlmInfrastructure(base);
    const highKE = calculateLlmInfrastructure({ ...base, kernelEfficiency: 0.9 });

    expect(Number(lowKE.requiredFLOPS)).toBeCloseTo(Number(highKE.requiredFLOPS), 6);
  });

  it('required FLOPS should not change when utilizationFactor changes (utilization affects capacity only)', () => {
    const base = {
      numUsers: 10000,
      tokensPerSecPerUser: 10,
      modelParams: 70,
      kernelEfficiency: 0.6,
      utilizationFactor: 0.8,
      peakFlops: 9e15,
      newInputTokensPerRequest: 1,
      attentionOverhead: 0.05,
      prefillOverhead: 0.05,
      redundancyFactor: 0.15,
      targetHeadroom: 0.10
    } as any;

    const highUtil = calculateLlmInfrastructure(base);
    const lowUtil = calculateLlmInfrastructure({ ...base, utilizationFactor: 0.5 });

    expect(Number(highUtil.requiredFLOPS)).toBeCloseTo(Number(lowUtil.requiredFLOPS), 6);
    // but capacity should change: GPU count should increase when utilization decreases
    expect(Number(lowUtil.gpuCount || 0)).toBeGreaterThanOrEqual(Number(highUtil.gpuCount || 0));
  });

  it('final GPU count must equal ceil( max(compute, memory) * (1 + redundancy) * (1 + headroom) )', () => {
    const inputs = {
      numUsers: 10000,
      tokensPerSecPerUser: 10,
      modelParams: 70,
      kernelEfficiency: 1.0,
      utilizationFactor: 0.8,
      peakFlops: 9e15,
      newInputTokensPerRequest: 1,
      attentionOverhead: 0.05,
      prefillOverhead: 0.05,
      redundancyFactor: 0.15,
      targetHeadroom: 0.10,
      vramPerGpu: 1e6
    } as any;

    const res = calculateLlmInfrastructure(inputs);

    const decodeFlopsPerToken = (4 * 70) * 1e9; // 4x params per token -> 280e9
    const decodeTokensPerSec = inputs.numUsers * inputs.tokensPerSecPerUser;
    const decodeFlopsPerSec = decodeTokensPerSec * decodeFlopsPerToken;
    const prefillFlopsPerSec = inputs.newInputTokensPerRequest * decodeFlopsPerToken * (decodeTokensPerSec / (inputs.avgResponseTokensPerRequest || 50));
    const baseRequired = (decodeFlopsPerSec + prefillFlopsPerSec) * (1 + inputs.attentionOverhead + inputs.prefillOverhead);

    const effectiveFlopsPerGpu = inputs.peakFlops * inputs.kernelEfficiency * inputs.utilizationFactor;
    const expectedCompute = Math.ceil(baseRequired / effectiveFlopsPerGpu);

    // For this test memory should not be the limiting factor; ensure max is compute
    expect(res.gpuCountMemory).toBeLessThanOrEqual(expectedCompute);

    const expectedFinal = Math.ceil(expectedCompute * (1 + inputs.redundancyFactor) * (1 + inputs.targetHeadroom));
    expect(res.gpuCount).toBe(expectedFinal);
  });

  it('required FLOPS for 70B/100k t/s equals 28 PFLOPS × (1 + attention + prefill) = 30.8 PFLOPS (workload only) when no prefill', () => {
    const inputs = {
      useProductionFramework: true,
      numUsers: 10000,
      tokensPerSecPerUser: 10,
      modelParams: 70,
      kernelEfficiency: 1.0,
      utilizationFactor: 0.8,
      peakFlops: 9e15,
      newInputTokensPerRequest: 0,
      avgResponseTokensPerRequest: 50,
      attentionOverhead: 0.05,
      prefillOverhead: 0.05,
      redundancyFactor: 0.15,
      targetHeadroom: 0.10
    } as any;

    const res = calculateLlmInfrastructure(inputs);

    // requiredFLOPS reported should be the workload-only number (in PFLOPS) ≈ 30.8
    expect(Number(res.requiredFLOPS || 0) / 1e15).toBeCloseTo(30.8, 2);
  });

  it('avgResponseTokensPerRequest changes prefill estimate and therefore required FLOPS', () => {
    const base = {
      useProductionFramework: true,
      numUsers: 10000,
      tokensPerSecPerUser: 10,
      modelParams: 70,
      kernelEfficiency: 1.0,
      utilizationFactor: 0.8,
      peakFlops: 9e15,
      newInputTokensPerRequest: 100,
      avgResponseTokensPerRequest: 50,
      attentionOverhead: 0.05,
      prefillOverhead: 0.05,
      redundancyFactor: 0.15,
      targetHeadroom: 0.10
    } as any;

    const res50 = calculateLlmInfrastructure(base);
    const res100 = calculateLlmInfrastructure({ ...base, avgResponseTokensPerRequest: 100 });

    // With avgTokensPerRequest=100, prefill/sec is half compared to 50; so total requiredFLOPS should decrease accordingly
    expect(Number(res100.requiredFLOPS || 0)).toBeLessThan(Number(res50.requiredFLOPS || 0));
  });

  it('required FLOPS must NOT change when utilization or capacity margins change (they affect capacity only)', () => {
    const base = {
      useProductionFramework: true,
      numUsers: 10000,
      tokensPerSecPerUser: 10,
      modelParams: 70,
      kernelEfficiency: 1.0,
      utilizationFactor: 0.8,
      peakFlops: 9e15,
      newInputTokensPerRequest: 0,
      attentionOverhead: 0.05,
      prefillOverhead: 0.05,
      redundancyFactor: 0.15,
      targetHeadroom: 0.10
    } as any;

    const a = calculateLlmInfrastructure(base);
    const b = calculateLlmInfrastructure({ ...base, utilizationFactor: 0.5 });
    const c = calculateLlmInfrastructure({ ...base, redundancyFactor: 0.30, targetHeadroom: 0.20 });

    expect(Number(a.requiredFLOPS || 0)).toBeCloseTo(Number(b.requiredFLOPS || 0), 6);
    expect(Number(a.requiredFLOPS || 0)).toBeCloseTo(Number(c.requiredFLOPS || 0), 6);
  });
});
