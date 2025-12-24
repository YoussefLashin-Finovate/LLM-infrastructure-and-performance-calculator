import { describe, it, expect } from 'vitest';
import { calculateCpuSizing } from '../calculations/cpuSizing';

describe('KV scaling and context usage', () => {
  it('uses context length when token breakdown is provided', () => {
    const base = calculateCpuSizing({
      N: 7,
      hardwareOpsPerUnit: 6.144e12,
      utilization: 0.3,
      Q: 1,
      users: 1,
      tokensPerUser: 1,
      inputLength: 0,
      responseLength: 0,
      thinkTime: 1,
      tokenBreakdown: { systemPromptTokens: 10, sessionHistoryTokens: 0, newInputTokens: 0, outputTokens: 0 },
      quantType: 'int8'
    });

    const larger = calculateCpuSizing({
      N: 7,
      hardwareOpsPerUnit: 6.144e12,
      utilization: 0.3,
      Q: 1,
      users: 1,
      tokensPerUser: 1,
      inputLength: 0,
      responseLength: 0,
      thinkTime: 1,
      tokenBreakdown: { systemPromptTokens: 10010, sessionHistoryTokens: 10000, newInputTokens: 512, outputTokens: 0 },
      quantType: 'int8'
    });

    expect(base.cpuSizing?.kvTotalGB).toBeGreaterThan(0);
    expect(larger.cpuSizing?.kvTotalGB).toBeGreaterThan((base.cpuSizing?.kvTotalGB || 0));

    // Verify that increasing context dramatically increases KV total
    const ratio = (larger.cpuSizing?.kvTotalGB || 1) / (base.cpuSizing?.kvTotalGB || 1);
    expect(ratio).toBeGreaterThan(1000); // large token increase => large KV increase

    // Now verify active fraction reduces effective KV proportionally
    const fracInputs = calculateCpuSizing({
      N: 7,
      hardwareOpsPerUnit: 6.144e12,
      utilization: 0.3,
      Q: 1,
      users: 3000,
      tokensPerUser: 10,
      inputLength: 0,
      responseLength: 0,
      thinkTime: 1,
      tokenBreakdown: { systemPromptTokens: 10000, sessionHistoryTokens: 10000, newInputTokens: 512, outputTokens: 0 },
      quantType: 'int8',
      activeKvFraction: 0.05
    });

    expect(fracInputs.cpuSizing?.kvActiveGB).toBeCloseTo((fracInputs.cpuSizing?.kvTotalGB || 0) * 0.05, 3);

    // Memory per CPU should decrease when active fraction is reduced (sanity check)
    const allActive = calculateCpuSizing({
      N: 7,
      hardwareOpsPerUnit: 6.144e12,
      utilization: 0.3,
      Q: 1,
      users: 3000,
      tokensPerUser: 10,
      inputLength: 0,
      responseLength: 0,
      thinkTime: 1,
      tokenBreakdown: { systemPromptTokens: 10000, sessionHistoryTokens: 10000, newInputTokens: 512, outputTokens: 0 },
      quantType: 'int8',
      activeKvFraction: 1
    });

    const mostlyActive = calculateCpuSizing({
      N: 7,
      hardwareOpsPerUnit: 6.144e12,
      utilization: 0.3,
      Q: 1,
      users: 3000,
      tokensPerUser: 10,
      inputLength: 0,
      responseLength: 0,
      thinkTime: 1,
      tokenBreakdown: { systemPromptTokens: 10000, sessionHistoryTokens: 10000, newInputTokens: 512, outputTokens: 0 },
      quantType: 'int8',
      activeKvFraction: 0.05
    });

    expect(mostlyActive.cpuSizing?.memoryPerCPU).toBeLessThan(allActive.cpuSizing?.memoryPerCPU || 0);
  });
});