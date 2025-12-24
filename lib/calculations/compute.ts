import * as Eq from '../equations';
import { calculatePrefillFlopsPerToken, calculateDecodeFlopsPerToken } from '../calculationParameters';

export interface ComputeNeedsArgs {
  modelParamsForCalc: number;
  tokenBreakdown?: any;
  Q: number;
  utilization: number;
  prefillOverhead: number;
  attentionOverhead: number;
  redundancyFactor: number;
  totalTokensPerSec: number;
  totalOutputTokensPerSec: number;
  modelName?: string;
}

export interface ComputeNeedsResult {
  flopsPerToken: number;
  flopsPerTokenGFLOPS: number;
  hardwareOpsNeeded: number;
  totalOverheadAdditive: number;
  overheadMultiplier: number;
  effectiveTokensPerSec: number;
}

export function computeHardwareNeeds(args: ComputeNeedsArgs): ComputeNeedsResult {
  const {
    modelParamsForCalc,
    tokenBreakdown,
    Q,
    utilization,
    prefillOverhead,
    attentionOverhead,
    redundancyFactor,
    totalTokensPerSec,
    totalOutputTokensPerSec,
    modelName
  } = args;

  const prefillFlopsPerToken = calculatePrefillFlopsPerToken(modelParamsForCalc, undefined, undefined, modelName);
  const decodeFlopsPerToken = calculateDecodeFlopsPerToken(modelParamsForCalc, undefined, undefined, modelName);

  const flopsPerTokenBase = tokenBreakdown
    ? (Eq.PREFILL_WEIGHT_CONTINUOUS * prefillFlopsPerToken + Eq.DECODE_WEIGHT_CONTINUOUS * decodeFlopsPerToken)
    : decodeFlopsPerToken;

  const flopsPerToken = flopsPerTokenBase * Q;
  // Only include model/algorithm additive overheads here; capacity-related multipliers (redundancy, headroom, utilization)
  // are applied when sizing hardware, not when computing the intrinsic required FLOPs.
  const totalOverheadAdditive = prefillOverhead + attentionOverhead;

  const hardwareOpsNeeded = Eq.calculateRequiredFLOPS(
    totalTokensPerSec,
    flopsPerToken,
    totalOverheadAdditive,
    utilization // kept for compatibility but not used in required FLOPs
  );

  const overheadMultiplier = 1 + totalOverheadAdditive;
  const effectiveTokensPerSec = totalOutputTokensPerSec * overheadMultiplier;

  return {
    flopsPerToken,
    flopsPerTokenGFLOPS: flopsPerToken / 1e9,
    hardwareOpsNeeded,
    totalOverheadAdditive,
    overheadMultiplier,
    effectiveTokensPerSec
  };
}
