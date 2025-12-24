export interface OverheadCalculation {
  prefillOverhead: number;
  attentionOverhead: number;
  totalMultiplier: number;
  breakdown: string[];
}

export function calculateOverheads(
  prefillTokens: number,
  sequenceLength: number,
  prefillThreshold: number = 100,
  attentionThreshold: number = 2000
): OverheadCalculation {
  const breakdown: string[] = [];
  let prefillOverhead = 0;
  if (prefillTokens > prefillThreshold) {
    prefillOverhead = Math.min(0.30, (prefillTokens / 1000) * 0.15);
    breakdown.push(`+${(prefillOverhead * 100).toFixed(0)}% prefill`);
  }
  let attentionOverhead = 0;
  if (sequenceLength > attentionThreshold) {
    attentionOverhead = Math.min(0.40, ((sequenceLength - attentionThreshold) / 10000) * 0.20);
    breakdown.push(`+${(attentionOverhead * 100).toFixed(0)}% attention`);
  }
  breakdown.push('+15% redundancy');
  const totalMultiplier = (1 + prefillOverhead) * (1 + attentionOverhead) * 1.15;
  return { prefillOverhead, attentionOverhead, totalMultiplier, breakdown };
}
