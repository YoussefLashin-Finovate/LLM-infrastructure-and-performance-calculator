/**
 * Model Architecture Database
 * 
 * Contains architecture specifications for different LLM models
 * to enable accurate KV cache and compute calculations.
 */

export interface ModelArchitecture {
  layers: number;
  hiddenSize: number;
  kvHeads: number;
  queryHeads: number;
  intermediateSize?: number;
  // MoE-specific parameters
  isMoE?: boolean;
  totalExperts?: number;
  activeExperts?: number;
  expertParallelism?: boolean;
}

/**
 * Llama Model Family Architecture Specifications
 * Based on official Llama 2 and Llama 3.1 specifications
 */
export const LLAMA_ARCHITECTURES: Record<number, ModelArchitecture> = {
  // Llama 3.1 405B
  405: {
    layers: 126,
    hiddenSize: 16384,
    kvHeads: 8,
    queryHeads: 128,
    intermediateSize: 53248,
  },
  // Llama 3.1 70B
  70: {
    layers: 80,
    hiddenSize: 8192,
    kvHeads: 8,
    queryHeads: 64,
    intermediateSize: 28672,
  },
  // Llama 3.1 8B
  8: {
    layers: 32,
    hiddenSize: 4096,
    kvHeads: 8,
    queryHeads: 32,
    intermediateSize: 14336,
  },
  // Llama 2 13B
  13: {
    layers: 40,
    hiddenSize: 5120,
    kvHeads: 40,
    queryHeads: 40,
    intermediateSize: 13824,
  },
  // Llama 2 7B
  7: {
    layers: 32,
    hiddenSize: 4096,
    kvHeads: 32,
    queryHeads: 32,
    intermediateSize: 11008,
  },
};

/**
 * MoE (Mixture of Experts) Model Family Architecture Specifications
 * Key distinction: totalExperts defines VRAM (all experts loaded)
 *                  activeExperts defines compute (only selected experts active)
 */
export const MOE_ARCHITECTURES: Record<string, ModelArchitecture> = {
  // Mixtral 8x7B (56B total parameters, but 13B active per token)
  'mixtral-8x7b': {
    layers: 32,
    hiddenSize: 4096,
    kvHeads: 8,
    queryHeads: 32,
    intermediateSize: 14336,
    isMoE: true,
    totalExperts: 8,
    activeExperts: 2,
    expertParallelism: false,
  },
  // Mixtral 8x22B (176B total parameters, but 44B active per token)
  'mixtral-8x22b': {
    layers: 56,
    hiddenSize: 6144,
    kvHeads: 8,
    queryHeads: 48,
    intermediateSize: 16384,
    isMoE: true,
    totalExperts: 8,
    activeExperts: 2,
    expertParallelism: false,
  },
  // DeepSeek-V2 (236B total, 21B active)
  'deepseek-v2': {
    layers: 60,
    hiddenSize: 5120,
    kvHeads: 16,
    queryHeads: 128,
    intermediateSize: 12288,
    isMoE: true,
    totalExperts: 160,
    activeExperts: 6,
    expertParallelism: false,
  },
  // GPT OSS 120B (16 experts, 15B active per token)
  'gpt-oss-120b': {
    layers: 48,
    hiddenSize: 6144,
    kvHeads: 12,
    queryHeads: 48,
    intermediateSize: 16384,
    isMoE: true,
    totalExperts: 16,
    activeExperts: 2,
    expertParallelism: false,
  },
  // Generic MoE - fallback for any model when MoE toggle is enabled
  // Assumes standard 8 expert, 2 active configuration (like Mixtral)
  'generic-moe': {
    layers: 32,
    hiddenSize: 4096,
    kvHeads: 8,
    queryHeads: 32,
    intermediateSize: 14336,
    isMoE: true,
    totalExperts: 8,
    activeExperts: 2,
    expertParallelism: false,
  },
};

/**
 * Llama Model Family Architecture Specifications
 * Based on official Llama 2 and Llama 3.1 specifications
 */

/**
 * Get model architecture specifications based on parameter count
 * 
 * For exact matches, returns the architecture directly.
 * For parameter counts between known sizes, interpolates values.
 * For sizes outside known range, uses the closest known architecture.
 * 
 * @param parametersBillions - Model size in billions of parameters
 * @param modelName - Optional model name for MoE lookup (e.g., 'mixtral-8x7b')
 * @returns Model architecture specification
 */
export function getModelArchitecture(
  parametersBillions: number,
  modelName?: string
): ModelArchitecture {
  // Handle custom model - use reasonable defaults based on parameter size
  if (modelName === 'custom') {
    const rounded = Math.round(parametersBillions);
    // Use the closest known architecture or create a reasonable default
    if (LLAMA_ARCHITECTURES[rounded]) {
      return LLAMA_ARCHITECTURES[rounded];
    }
    // Interpolate or use a reasonable default (Llama 70B scaled)
    return {
      layers: Math.max(32, Math.round(80 * parametersBillions / 70)),
      hiddenSize: 8192,
      kvHeads: 8,
      queryHeads: 64,
      intermediateSize: 28672,
      isMoE: false
    };
  }
  
  // Check for MoE model by name first
  if (modelName && MOE_ARCHITECTURES[modelName.toLowerCase()]) {
    return MOE_ARCHITECTURES[modelName.toLowerCase()];
  }
  
  // Round to nearest integer for lookup
  const rounded = Math.round(parametersBillions);
  
  // Direct match
  if (LLAMA_ARCHITECTURES[rounded]) {
    return LLAMA_ARCHITECTURES[rounded];
  }
  
  // Get sorted list of available sizes
  const sizes = Object.keys(LLAMA_ARCHITECTURES)
    .map(Number)
    .sort((a, b) => a - b);
  
  // Below smallest model - use smallest
  if (parametersBillions < sizes[0]) {
    return LLAMA_ARCHITECTURES[sizes[0]];
  }
  
  // Above largest model - use largest
  if (parametersBillions > sizes[sizes.length - 1]) {
    return LLAMA_ARCHITECTURES[sizes[sizes.length - 1]];
  }
  
  // Find bracketing sizes for interpolation
  let lowerSize = sizes[0];
  let upperSize = sizes[sizes.length - 1];
  
  for (let i = 0; i < sizes.length - 1; i++) {
    if (parametersBillions >= sizes[i] && parametersBillions <= sizes[i + 1]) {
      lowerSize = sizes[i];
      upperSize = sizes[i + 1];
      break;
    }
  }
  
  // Linear interpolation
  const lowerArch = LLAMA_ARCHITECTURES[lowerSize];
  const upperArch = LLAMA_ARCHITECTURES[upperSize];
  const ratio = (parametersBillions - lowerSize) / (upperSize - lowerSize);
  
  return {
    layers: Math.round(lowerArch.layers + (upperArch.layers - lowerArch.layers) * ratio),
    hiddenSize: Math.round(lowerArch.hiddenSize + (upperArch.hiddenSize - lowerArch.hiddenSize) * ratio),
    kvHeads: Math.round(lowerArch.kvHeads + (upperArch.kvHeads - lowerArch.kvHeads) * ratio),
    queryHeads: Math.round(lowerArch.queryHeads + (upperArch.queryHeads - lowerArch.queryHeads) * ratio),
    intermediateSize: lowerArch.intermediateSize && upperArch.intermediateSize
      ? Math.round(lowerArch.intermediateSize + (upperArch.intermediateSize - lowerArch.intermediateSize) * ratio)
      : undefined,
  };
}

/**
 * Calculate KV cache bytes per token with GQA optimization
 * 
 * Formula: 2 (K+V) × layers × hidden_size × bytes_per_value × GQA_ratio
 * 
 * GQA (Grouped Query Attention) optimization:
 * For models with fewer KV heads than query heads, the KV cache is smaller.
 * GQA_ratio = kvHeads / queryHeads
 * 
 * @param architecture - Model architecture specification
 * @param bytesPerValue - Bytes per parameter (1 for INT8, 2 for FP16, etc.)
 * @returns Bytes per token for KV cache
 */
export function calculateKVBytesPerTokenWithGQA(
  architecture: ModelArchitecture,
  bytesPerValue: number
): number {
  // GQA optimization: only store KV for the KV heads, not all query heads
  const gqaRatio = architecture.kvHeads / architecture.queryHeads;
  
  // 2 for K and V, multiply by layers, hidden size, bytes, and GQA ratio
  const baseKVSize = 2 * architecture.layers * architecture.hiddenSize * bytesPerValue;
  
  return baseKVSize * gqaRatio;
}

/**
 * Calculate active parameters for compute (FLOPs)
 * 
 * Dense models: All parameters are always active
 * MoE models: Only active experts are used for compute
 * 
 * For known MoE architectures, we use empirically measured active parameters.
 * For generic/unknown MoE models, we use a standard 8-expert, 2-active configuration.
 * 
 * Known active parameters:
 * - Mixtral 8x7B (46.7B total): 13B active (~27.8%)
 * - Mixtral 8x22B (176B total): 44B active (~25%)
 * - DeepSeek-V2 (236B total): 21B active (~8.9%)
 * - GPT-OSS-120B (120B total): 15B active (~12.5%)
 * - Generic MoE (any size): ~27.8% active (2/8 experts, Mixtral-style)
 * 
 * @param totalParams - Total model parameters in billions
 * @param architecture - Model architecture specification
 * @returns Active parameters for compute in billions
 */
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

/**
 * Calculate VRAM parameters (what must be loaded into GPU memory)
 * 
 * Dense models: All parameters must be in VRAM
 * MoE without expert parallelism: All parameters must be in VRAM
 * MoE with expert parallelism: Only shard of experts needs to be in VRAM per GPU
 * 
 * @param totalParams - Total model parameters in billions
 * @param architecture - Model architecture specification
 * @param numShards - Number of shards for expert parallelism (default 1 = no sharding)
 * @returns Parameters that must be in VRAM in billions
 */
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
