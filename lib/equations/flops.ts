import { REDUNDANCY_FACTOR } from './constants';

export function calculateRequiredFLOPS(
  tokensPerSec: number,
  flopsPerToken: number,
  totalOverheadAdditive: number,
  // `utilization` parameter is accepted for compatibility but should not affect the
  // intrinsic workload. Utilization affects capacity (available FLOPs), not required FLOPs.
  utilization?: number
): number {
  const multiplier = 1 + totalOverheadAdditive;
  // Required FLOPs = workload (tokens/sec × FLOPs/token) × model/algorithm additive overheads
  // Do NOT divide by utilization or other capacity margins here.
  return tokensPerSec * flopsPerToken * multiplier;
}

export function calculateEffectiveParams(
  totalParams: number,
  isMoE: boolean = false,
  activeExperts: number = 1,
  totalExperts: number = 1
): number {
  if (!isMoE) return totalParams;
  return totalParams * (activeExperts / totalExperts);
}
