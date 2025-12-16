/**
 * Calculation Parameters for LLM Infrastructure
 * Contains constants, multipliers, and helper functions for calculations
 */

import { getModelArchitecture, calculateKVBytesPerTokenWithGQA, getActiveParameters, getVRAMParameters } from './modelArchitectures';

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
  'bf16': 2,
  'fp8': 1,
  'int8': 1,
  'int4': 0.5,
  'q4_k_s': 0.5
};

// Token categorization constants
// Note: Both prefill and decode use same multiplier (~6 FLOPs per param per token)
// Reference: "Attention is All You Need" and empirical LLM measurements
export const TOKEN_FLOPS_PREFILL_K = 6.0;      // Prefill FLOPS multiplier (forward pass)
export const TOKEN_FLOPS_DECODE_K = 6.0;       // Decode FLOPS multiplier (same as prefill per reference)
export const KV_BYTES_PER_TOKEN_BASE = 2;      // Base bytes per token for KV cache
export const KV_LAYERS_MULTIPLIER = 1.0;       // Multiplier for number of layers
export const KV_HIDDEN_DIM_DEFAULT = 4096;     // Default hidden dimension

// VRAM safety constants
export const VRAM_SAFETY_BUFFER_PERCENT = 0.10; // 10% safety buffer
export const VRAM_MIN_SAFETY_BUFFER_GB = 8;    // Minimum 8GB safety buffer
export const VRAM_COLD_START_MULTIPLIER = 1.15; // 15% extra for cold starts

// Production overhead factors
export const UTILIZATION_FACTOR_DEFAULT = 0.35; // Conservative utilization
export const REDUNDANCY_FACTOR_DEFAULT = 1.15;  // N+1 redundancy
export const BURST_FACTOR_DEFAULT = 1.10;       // 10% burst capacity

// Calculate model size after quantization (returns size in GB)
// For MoE models, this returns the VRAM requirement (all experts if no parallelism)
export const calculateModelSize = (
  params: number,
  quant: string,
  modelName?: string,
  expertShards: number = 1
): number => {
  const bytes = bytesPerParam[quant] || 2;
  
  // Get architecture to check if MoE
  const architecture = getModelArchitecture(params, modelName);
  const vramParams = getVRAMParameters(params, architecture, expertShards);
  
  // params is in billions (e.g., 70 for 70B model)
  // Convert to actual bytes: params * 1e9 * bytes_per_param * overhead
  // Then convert to GB: / 1e9
  return (vramParams * bytes * MODEL_SIZE_OVERHEAD); // Returns GB
};

// Calculate KV cache bytes per token using model-specific architecture
// If modelParams provided, uses actual model architecture with GQA optimization
// Otherwise falls back to manual hiddenDim/numLayers (legacy mode)
export const calculateKVBytesPerToken = (
  hiddenDimOrModelParams: number = KV_HIDDEN_DIM_DEFAULT,
  numLayersOrDtype?: number | string,
  dtypeOrModelName?: string
): number => {
  // Determine if we're using new model-based calculation or legacy manual params
  // Model-based: second param is a string (quant type like 'int8', 'fp16')
  // Legacy: second param is a number (numLayers)
  const isModelBased = typeof numLayersOrDtype === 'string';
  
  if (isModelBased) {
    // New mode: calculateKVBytesPerToken(modelParams, dtype, modelName?)
    const modelParams = hiddenDimOrModelParams;
    const dtype = numLayersOrDtype as string;
    const modelName = dtypeOrModelName; // Third parameter can be modelName
    const architecture = getModelArchitecture(modelParams, modelName);
    const bytesPerValue = bytesPerParam[dtype] || 2;
    return calculateKVBytesPerTokenWithGQA(architecture, bytesPerValue);
  } else {
    // Legacy mode: calculateKVBytesPerToken(hiddenDim, numLayers, dtype)
    const hiddenDim = hiddenDimOrModelParams;
    const numLayers = numLayersOrDtype as number || 32;
    const dtype = dtypeOrModelName || 'fp16';
    const bytesPerValue = bytesPerParam[dtype] || 2;
    // Simple calculation without GQA optimization
    return 2 * numLayers * hiddenDim * bytesPerValue;
  }
};

// Calculate prefill FLOPS per token
// MoE models use ACTIVE parameters, Dense models use ALL parameters
export const calculatePrefillFlopsPerToken = (
  modelParams: number,
  kMultiplier: number = TOKEN_FLOPS_PREFILL_K,
  modelName?: string
): number => {
  const architecture = getModelArchitecture(modelParams, modelName);
  const activeParams = getActiveParameters(modelParams, architecture);
  return kMultiplier * activeParams;
};

// Calculate decode FLOPS per token
// Decode cost is dominated by attention/KV cache, NOT affected by active parameters
// Both Dense and MoE use the same decode cost per token
export const calculateDecodeFlopsPerToken = (
  modelParams: number,
  kMultiplier: number = TOKEN_FLOPS_DECODE_K,
  modelName?: string
): number => {
  // Decode FLOPs are NOT reduced by active parameters
  // Attention mechanisms process full context regardless of expert selection
  return kMultiplier * modelParams;
};

// Calculate VRAM safety buffer
export const calculateVRAMSafetyBuffer = (gpuMemoryGB: number): number => {
  const percentBased = gpuMemoryGB * VRAM_SAFETY_BUFFER_PERCENT;
  return Math.max(percentBased, VRAM_MIN_SAFETY_BUFFER_GB);
};