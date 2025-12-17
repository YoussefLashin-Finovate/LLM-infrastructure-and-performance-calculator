import { REDUNDANCY_FACTOR } from './constants';

export function calculateRequiredFLOPS(
  tokensPerSec: number,
  flopsPerToken: number,
  totalOverheadAdditive: number,
  utilization: number
): number {
  const multiplier = 1 + totalOverheadAdditive;
  return (tokensPerSec * flopsPerToken * multiplier) / Math.max(1e-9, utilization);
}

export function calculateEffectiveParams(
  activeParams: number,
  totalParams: number,
  useTokenBreakdown: boolean = false
): number {
  if (useTokenBreakdown) {
    return (activeParams * 0.05) + (totalParams * 0.95);
  }
  return (activeParams + totalParams) / 2;
}
