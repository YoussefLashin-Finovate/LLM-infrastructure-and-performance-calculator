import { describe, it, expect } from 'vitest';
import { calculateLlmInfrastructure } from '../calculations/llmInfrastructure';

describe('CPU sizing and memory accounting', () => {
  it('for CPU workloads, KV memory is calculated and CPU overrides are respected', () => {
    const inputs = {
      modelParams: 13,
      users: 100,
      inputLength: 100,
      tokensPerUser: 10,
      hardwareOpsPerUnit: 1e12,
      utilization: 0.8,
      quantType: 'fp16',
      tokenBreakdown: {
        systemPromptTokens: 10,
        sessionHistoryTokens: 0,
        newInputTokens: 50,
        outputTokens: 200
      },
      isCPU: true,
      cpuPrefillMultiplier: 1.2,
      cpuUtilizationTarget: 0.7,
      cpuRedundancy: 1.1,
      cpuAMXEfficiency: 0.3,
      cpuModelRamOverhead: 1.2
    } as any;

    const res = calculateLlmInfrastructure(inputs);
    expect(res.cpuSizing).toBeDefined();
    expect(res.cpuSizing?.kvTotalGB).toBeGreaterThan(0);
    expect(res.cpuSizing?.finalCPUsRounded).toBeGreaterThanOrEqual(1);
    // New fields from formula
    expect(res.cpuSizing?.targetTPSPerCPU).toBeGreaterThan(0);
    expect(res.cpuSizing?.cpusCompute).toBeGreaterThan(0);
    // Delivered TPS should be computed from targetTPSPerCPU
    expect(res.cpuSizing?.deliveredTPS).toBeCloseTo((res.cpuSizing?.finalCPUsRounded || 0) * (res.cpuSizing?.targetTPSPerCPU || 0), 1);
  });

  it('computes total FLOPs for a 7B workload correctly (~420 TFLOPS for 30k t/s)', () => {
    const inputs = {
      modelParams: 7,
      users: 3000,
      tokensPerUser: 10,
      hardwareOpsPerUnit: 6.144e12, // example CPU peak in FLOPs/s (6.144 TFLOPS)
      utilization: 0.3,
      quantType: 'int8',
      tokenBreakdown: {
        systemPromptTokens: 0,
        sessionHistoryTokens: 0,
        newInputTokens: 1,
        outputTokens: 0
      },
      isCPU: true,
      cpuUtilizationTarget: 0.3,
      cpuAMXEfficiency: 0.8
    } as any;

    const res = calculateLlmInfrastructure(inputs);
    expect(res.cpuSizing).toBeDefined();
    // flops per token should be ~14 GFLOPS/token (CPU multiplier)
    expect(res.cpuSizing?.flopsPerTokenGFLOPS).toBeCloseTo(14, 1);
    // total flops should be ~420 TFLOPS
    expect(res.cpuSizing?.totalFlopsTFLOPS).toBeCloseTo(420, 1);

    // New test: TPS per CPU should match declared efficiencies
    // Effective TFLOPs per CPU = peak * cpuUtilizationTarget * cpuAMXEfficiency
    const effectiveTFLOPS = 6.144 * 0.3 * 0.8; // in TFLOPS
    const expectedTPS = effectiveTFLOPS / (14 / 1000); // 14 GFLOPS/token = 0.014 TFLOPS/token
    // allow small numerical tolerance
    expect(res.cpuSizing?.targetTPSPerCPU).toBeCloseTo(expectedTPS, 1);
  });
});