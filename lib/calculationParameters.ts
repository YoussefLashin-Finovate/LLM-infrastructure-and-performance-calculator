// Quantization efficiency factors (accounts for accuracy loss and kernel efficiency)
export const quantEfficiency: Record<string, number> = {
  fp16: 0.95,
  int8: 0.88,
  int4: 0.80
};

// Memory bandwidth considerations (GB/s)
export const memoryBandwidth: Record<string, Record<string, number>> = {
  fp16: { h100: 3350, h200: 4800, a100: 2000, a6000: 768, default: 1000 },
  int8: { h100: 3350, h200: 4800, a100: 2000, a6000: 768, default: 1000 },
  int4: { h100: 3350, h200: 4800, a100: 2000, a6000: 768, default: 1000 }
};

// Model size calculation overhead factor
export const MODEL_SIZE_OVERHEAD = 1.2;

// Redundancy factor for reverse calculations
export const REDUNDANCY_FACTOR = 1.15;

// Prefill overhead calculation parameters
export const PREFILL_BASE_OVERHEAD = 0.15;
export const PREFILL_MAX_OVERHEAD = 0.3;
export const PREFILL_SCALING_FACTOR = 1000;

// Attention overhead calculation parameters
export const ATTENTION_BASE_OVERHEAD = 0.2;
export const ATTENTION_MAX_OVERHEAD = 0.4;
export const ATTENTION_THRESHOLD = 2000;
export const ATTENTION_SCALING_FACTOR = 10000;

// Theoretical performance calculation constants
export const THEORETICAL_CONSTANT = 6;
export const BILLION = 1e9;

// KV cache calculation parameters
export const KV_CACHE_CONSTANT_1 = 2;
export const KV_CACHE_CONSTANT_2 = 0.15;
export const KV_CACHE_CONSTANT_3 = 128;

// Bytes per parameter for different quantization types
export const bytesPerParam: Record<string, number> = {
  'fp32': 4,
  'fp16': 2,
  'fp8': 1,
  'int8': 1,
  'int4': 0.5
};

// Calculate model size after quantization
export const calculateModelSize = (params: number, quant: string): number => {
  const bytes = bytesPerParam[quant] || 2;
  return (params * bytes) * MODEL_SIZE_OVERHEAD; // Add overhead for activations
};