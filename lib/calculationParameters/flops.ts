import { getModelArchitecture, getActiveParameters } from '../modelArchitectures';
import { TOKEN_FLOPS_PREFILL_K, TOKEN_FLOPS_DECODE_K, KERNEL_EFFICIENCY_DEFAULT } from './constants';
import { calculateEffectiveParams } from '../equations/flops';

// Calculate FLOPs multiplier based on GPU model size (existing GPU multipliers)
export const calculateFlopsMultiplier = (paramsBillions: number): number => {
  if (paramsBillions < 10) return 2.3;  // Small models: lower overhead (GPU tuned)
  if (paramsBillions < 70) return 3.0;  // Medium models
  if (paramsBillions < 200) return 4.0; // Large models
  return 5.5; // Very large models
};

// Calculate CPU-specific multipliers (midpoints of recommended ranges provided)
export const calculateCpuFlopsMultiplier = (paramsBillions: number): number => {
  if (paramsBillions < 10) return 2.0;   // 1.9 - 2.1 -> midpoint 2.0
  if (paramsBillions < 70) return 2.15;  // 2.0 - 2.3 -> midpoint 2.15
  if (paramsBillions < 200) return 2.45; // 2.3 - 2.6 -> midpoint 2.45
  return 2.8;                             // 2.6 - 3.0 -> midpoint 2.8
};

// Calculate prefill FLOPS per token (FLOPS units)
export const calculatePrefillFlopsPerToken = (
  modelParams: number,
  kMultiplier?: number,
  kernelEfficiency: number = KERNEL_EFFICIENCY_DEFAULT,
  modelName?: string,
  device: 'gpu' | 'cpu' = 'gpu'
): number => {
  const architecture = getModelArchitecture(modelParams, modelName);
  const isMoE = architecture.isMoE || false;
  const activeExperts = architecture.activeExperts || 1;
  const totalExperts = architecture.totalExperts || 1;
  const effectiveParams = calculateEffectiveParams(modelParams, isMoE, activeExperts, totalExperts);
  const flopsMultiplier = (typeof kMultiplier === 'number') ? kMultiplier : (device === 'cpu' ? calculateCpuFlopsMultiplier(modelParams) : calculateFlopsMultiplier(modelParams));
  // FLOPs per token is a theoretical workload metric and should NOT be scaled by runtime kernel efficiency.
  // Kernel efficiency reduces the *available* FLOPs on hardware (applied when calculating effective Flops per unit).
  return flopsMultiplier * effectiveParams * 1e9;
};

// Calculate decode FLOPS per token (FLOPS units)
export const calculateDecodeFlopsPerToken = (
  modelParams: number,
  kMultiplier?: number,
  kernelEfficiency: number = KERNEL_EFFICIENCY_DEFAULT,
  modelName?: string,
  device: 'gpu' | 'cpu' = 'gpu',
  sequenceLength?: number
): number => {
  const architecture = getModelArchitecture(modelParams, modelName);
  const isMoE = architecture.isMoE || false;
  const activeExperts = architecture.activeExperts || 1;
  const totalExperts = architecture.totalExperts || 1;
  const effectiveParams = calculateEffectiveParams(modelParams, isMoE, activeExperts, totalExperts);
  
  // Base multiplier from model size
  let flopsMultiplier = (typeof kMultiplier === 'number') ? kMultiplier : (device === 'cpu' ? calculateCpuFlopsMultiplier(modelParams) : calculateFlopsMultiplier(modelParams));
  
  // For decode operations, attention FLOPs scale with sequence length
  // For long contexts, effective FLOPs/param/token increases significantly
  if (sequenceLength && sequenceLength > 1024) {
    // For large models with long contexts, use higher multiplier
    // 70B at 3k context: ~10 FLOPs/param/token instead of 4
    if (modelParams >= 50) { // 50B+ models
      flopsMultiplier = Math.max(flopsMultiplier, 10);
    } else if (modelParams >= 20) { // 20-50B models
      flopsMultiplier = Math.max(flopsMultiplier, 8);
    }
  }
  
  // FLOPs per token is a theoretical workload metric and should NOT be scaled by runtime kernel efficiency.
  // Kernel efficiency reduces the *available* FLOPs on hardware (applied when calculating effective Flops per unit).
  return flopsMultiplier * effectiveParams * 1e9;
};
