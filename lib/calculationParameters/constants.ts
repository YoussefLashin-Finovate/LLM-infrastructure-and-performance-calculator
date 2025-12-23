/**
 * Constants used across calculation modules
 */
export const MODEL_SIZE_OVERHEAD = 1.2;
export const REDUNDANCY_FACTOR = 5;

export const PREFILL_BASE_OVERHEAD = 0.15;
export const PREFILL_MAX_OVERHEAD = 0.3;
export const PREFILL_SCALING_FACTOR = 1000;

export const ATTENTION_BASE_OVERHEAD = 0.2;
export const ATTENTION_MAX_OVERHEAD = 0.4;
export const ATTENTION_THRESHOLD = 2000;
export const ATTENTION_SCALING_FACTOR = 10000;

export const THEORETICAL_CONSTANT = 2; // Use theoretical 2× params per token for decoder-only models
export const BILLION = 1e9;

export const KV_CACHE_CONSTANT_1 = 2;
export const KV_CACHE_CONSTANT_2 = 0.15;
export const KV_CACHE_CONSTANT_3 = 128;

export const KERNEL_EFFICIENCY_DEFAULT = 0.33;

// VRAM and runtime tuning constants are kept local to the modules that need them.
// Removed unused public defaults to reduce public API surface.

export const TOKEN_FLOPS_PREFILL_K = 2.0;
export const TOKEN_FLOPS_DECODE_K = 2.0;

export const bytesPerParam: Record<string, number> = {
  'fp32': 4,
  'fp16': 2,
  'bf16': 2,
  'fp8': 1,
  'int8': 1,
  'int4': 0.5,
  'q4_k_s': 0.5
};

export const quantEfficiency: Record<string, number> = {
  fp16: 0.95,
  int8: 0.88,
  int4: 0.80
};

export const memoryBandwidth: Record<string, Record<string, number>> = {
  fp16: { h100: 3350, h200: 4800, a100: 2000, a6000: 768, default: 1000 },
  int8: { h100: 3350, h200: 4800, a100: 2000, a6000: 768, default: 1000 },
  int4: { h100: 3350, h200: 4800, a100: 2000, a6000: 768, default: 1000 }
};

export const gpuUtilizationFactor = 0.35;
