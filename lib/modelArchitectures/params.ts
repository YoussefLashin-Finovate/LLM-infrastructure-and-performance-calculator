import { ModelArchitecture } from './types';

export function getActiveParameters(
  totalParams: number,
  architecture: ModelArchitecture
): number {
  if (!architecture.isMoE || !architecture.totalExperts || !architecture.activeExperts) {
    // Dense model: all parameters are active
    return totalParams;
  }
  
  // For MoE models, use model-specific active parameter ratios
  // These ratios are derived from published specifications
  const expertActivationRatio = architecture.activeExperts / architecture.totalExperts;
  
  // Model-specific active ratios (empirically measured)
  let activeRatio: number;
  
  // Mixtral family (8 experts, 2 active): ~25-28% active
  if (architecture.totalExperts === 8 && architecture.activeExperts === 2) {
    if (totalParams >= 170 && totalParams <= 180) {
      // Mixtral 8x22B: 44/176 = 25%
      activeRatio = 0.25;
    } else {
      // Mixtral 8x7B or generic: 13/46.7 = 27.8%
      // This is the default for any unknown model with MoE enabled
      activeRatio = 0.278;
    }
  }
  // DeepSeek-V2 (160 experts, 6 active): ~8.9% active
  else if (architecture.totalExperts === 160 && architecture.activeExperts === 6) {
    activeRatio = 0.089; // 21/236
  }
  // GPT-OSS family (16 experts, 2 active): ~12.5% active
  else if (architecture.totalExperts === 16 && architecture.activeExperts === 2) {
    activeRatio = 0.125; // 15/120
  }
  // Fallback: generic MoE with standard calculations
  // Uses 5% shared parameters + 95% expert parameters with activation ratio
  else {
    const sharedRatio = 0.05;
    const expertRatio = 0.95;
    activeRatio = sharedRatio + (expertRatio * expertActivationRatio);
  }
  
  return totalParams * activeRatio;
}

export function getVRAMParameters(
  totalParams: number,
  architecture: ModelArchitecture,
  numShards: number = 1
): number {
  if (!architecture.isMoE || !architecture.expertParallelism || numShards === 1) {
    // Dense model OR MoE without expert parallelism: all params in VRAM
    return totalParams;
  }
  
  // MoE with expert parallelism: distribute experts across shards
  // VRAM = shared_params + (expert_params / numShards)
  // Simplified: assume linear distribution
  const expertRatio = architecture.activeExperts! / architecture.totalExperts!;
  const sharedParams = totalParams * (1 - expertRatio);
  const expertParams = totalParams * expertRatio;
  
  return sharedParams + (expertParams / numShards);
}
