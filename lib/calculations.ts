/**
 * LLM Infrastructure Calculations
 * 
 * Uses unified equations module for all mathematical operations.
 * See lib/equations.ts for core formulas and constants.
 */

import { CalculatorInputs, CalculatorResults, ReverseCalculatorInputs, ReverseCalculatorResults, TokenBreakdown, TokenComputeCosts, KVCacheState, VRAMAllocation, BatchingStrategy } from './types';
import { 
  quantEfficiency, 
  memoryBandwidth, 
  MODEL_SIZE_OVERHEAD, 
  PREFILL_BASE_OVERHEAD, 
  PREFILL_MAX_OVERHEAD, 
  PREFILL_SCALING_FACTOR, 
  ATTENTION_BASE_OVERHEAD, 
  ATTENTION_MAX_OVERHEAD, 
  ATTENTION_THRESHOLD, 
  ATTENTION_SCALING_FACTOR, 
  THEORETICAL_CONSTANT, 
  BILLION, 
  KV_CACHE_CONSTANT_1, 
  KV_CACHE_CONSTANT_2, 
  KV_CACHE_CONSTANT_3, 
  bytesPerParam, 
  REDUNDANCY_FACTOR,
  TOKEN_FLOPS_PREFILL_K,
  TOKEN_FLOPS_DECODE_K,
  KERNEL_EFFICIENCY_DEFAULT,
  calculateKVBytesPerToken,
  calculatePrefillFlopsPerToken,
  calculateDecodeFlopsPerToken,
  calculateVRAMSafetyBuffer,
  calculateModelSize
} from './calculationParameters';
import { getModelArchitecture, getActiveParameters } from './modelArchitectures';
import * as Eq from './equations';
import { calculateCpuSizing } from './calculations/cpuSizing';
import { calculateBatchingStrategy, createFailedBatchingStrategy } from './calculations/batching';
import { computeHardwareNeeds } from './calculations/compute';
import { calculateTokenAwareResults } from './calculations/tokenAware';

/**
 * Map parameter count and MoE flag to specific model architecture name
 * This allows the boolean toggle to select the appropriate MoE architecture
 * 
 * For known models, maps to specific architectures.
 * For unknown models, creates a generic MoE configuration.
 */
function getModelNameFromParams(params: number, useMoeArchitecture: boolean): string | undefined {
  if (!useMoeArchitecture) return undefined;
  
  // Map known MoE models based on parameter count
  if (params >= 119 && params <= 121) return 'gpt-oss-120b';
  if (params >= 46 && params <= 47) return 'mixtral-8x7b';
  if (params >= 175 && params <= 177) return 'mixtral-8x22b';
  if (params >= 235 && params <= 237) return 'deepseek-v2';
  
  // For any other model with MoE enabled, return a generic identifier
  // This will trigger default MoE calculations
  return 'generic-moe';
}

export { calculatePerformance } from './calculations/performance';

/**
 * Calculate realistic batching strategy based on actual LLM inference constraints
 * 
 * REALISTIC INFERENCE ASSUMPTIONS:
 * - Batch sizes: 16-64 typical, 128 max for large GPUs
 * - Activation memory: ~20-30% of model size per batch
 * - Attention buffers: significant memory overhead
 * - KV cache offloading: reduces VRAM but NOT compute
 * - H100 70B throughput: 1500-3000 tokens/sec at optimal batch size
 * 
 * @param gpuMemoryGB - Available VRAM per GPU
 * @param modelSizeGB - Model weights size
 * @param kvCachePerRequestGB - KV cache memory per request (0 if offloaded)
 * @param totalUsers - Total concurrent users
 * @param tokensPerRequest - Tokens processed per request
 * @param modelParams - Model parameters in billions
 * @param numGPUs - Number of GPUs available
 * @returns Realistic batching configuration
 */
// Batching strategy implementation moved to `lib/calculations/batching.ts`.
// The functions are imported at the top of this file and used where needed.

export { calculateLlmInfrastructure, calculateLlmInfrastructure as calculateReverseInfrastructure } from './calculations/llmInfrastructure';
