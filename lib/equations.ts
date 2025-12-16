/**
 * Unified LLM Infrastructure Equations
 * 
 * Single source of truth for all mathematical calculations.
 * All equations are documented and type-safe.
 */

/**
 * CORE CONSTANTS
 */
export const FLOPS_PER_TOKEN = 2; // Inference: 2× FLOPs per token (forward pass only)
export const DEFAULT_REQUEST_FREQUENCY = 1 / 60; // 1 request per minute per user
export const DECODE_WEIGHT_CONTINUOUS = 0.95; // 95% decode in continuous serving
export const PREFILL_WEIGHT_CONTINUOUS = 0.05; // 5% prefill in continuous serving
export const REDUNDANCY_FACTOR = 1.15; // 15% redundancy for production
export const ATTENTION_BUFFER_GB = 2.0; // Fixed attention buffer overhead

/**
 * THROUGHPUT CALCULATIONS
 */

export interface ContinuousServingRate {
  decodeRate: number;
  prefillRate: number;
  totalRate: number;
  decodePercentage: number;
}

/**
 * Calculate token throughput for continuous serving scenarios
 * In continuous serving, users are already generating (decode-dominant)
 */
export function calculateContinuousServingRate(
  users: number,
  decodeRatePerUser: number,
  prefillTokens: number,
  requestsPerSecPerUser: number = DEFAULT_REQUEST_FREQUENCY
): ContinuousServingRate {
  const decodeRate = users * decodeRatePerUser;
  const prefillRate = users * prefillTokens * requestsPerSecPerUser;
  const totalRate = decodeRate + prefillRate;
  
  return {
    decodeRate,
    prefillRate,
    totalRate,
    decodePercentage: (decodeRate / totalRate) * 100
  };
}

/**
 * FLOPS CALCULATIONS
 */

/**
 * Calculate required FLOPs for inference workload
 * Formula: tokens/sec × 2 × parameters × 1e9 × overhead / (utilization × quantization_efficiency)
 */
export function calculateRequiredFLOPS(
  tokensPerSec: number,
  parameters: number, // in billions
  overheadMultiplier: number,
  utilization: number,
  quantizationEfficiency: number
): number {
  return (tokensPerSec * FLOPS_PER_TOKEN * parameters * 1e9 * overheadMultiplier) / 
         (utilization * quantizationEfficiency);
}

/**
 * Calculate effective parameters for MoE models in continuous serving
 * Decode-dominant: weighted average favoring total params
 */
export function calculateEffectiveParams(
  activeParams: number,
  totalParams: number,
  useTokenBreakdown: boolean = false
): number {
  if (useTokenBreakdown) {
    // Continuous serving: 95% decode (total params), 5% prefill (active params)
    return (activeParams * PREFILL_WEIGHT_CONTINUOUS) + (totalParams * DECODE_WEIGHT_CONTINUOUS);
  }
  // Legacy: simple average
  return (activeParams + totalParams) / 2;
}

/**
 * GPU CALCULATIONS
 */

export interface GPURequirements {
  computeGPUs: number;
  vramGPUs: number;
  optimalGPUs: number;
  isComputeBound: boolean;
  tensorParallelismRequired: boolean;
}

/**
 * Calculate optimal GPU count considering both compute and VRAM requirements
 */
export function calculateOptimalGPUs(
  requiredFLOPS: number,
  flopsPerGPU: number,
  modelSizeGB: number,
  kvCacheInVRAMGB: number,
  vramPerGPU: number,
  safetyBufferGB: number,
  attentionBufferGB: number = ATTENTION_BUFFER_GB
): GPURequirements {
  // Compute-based requirement
  const computeGPUs = Math.ceil(requiredFLOPS / flopsPerGPU);
  
  // VRAM-based requirement (with tensor parallelism support)
  const totalVRAMNeeded = modelSizeGB + kvCacheInVRAMGB + safetyBufferGB + attentionBufferGB;
  const vramGPUs = Math.ceil(totalVRAMNeeded / vramPerGPU);
  
  const optimalGPUs = Math.max(computeGPUs, vramGPUs);
  
  return {
    computeGPUs,
    vramGPUs,
    optimalGPUs,
    isComputeBound: computeGPUs > vramGPUs,
    tensorParallelismRequired: vramGPUs > 1
  };
}

/**
 * KV CACHE CALCULATIONS
 */

export interface KVCacheSplit {
  totalGB: number;
  inVRAM: number;
  offloaded: number;
  percentage: number;
}

/**
 * Split KV cache between GPU VRAM and CPU/NVMe storage
 */
export function splitKVCache(totalKVCacheGB: number, offloadingPercentage: number): KVCacheSplit {
  const ratio = offloadingPercentage / 100;
  return {
    totalGB: totalKVCacheGB,
    inVRAM: totalKVCacheGB * (1 - ratio),
    offloaded: totalKVCacheGB * ratio,
    percentage: offloadingPercentage
  };
}

/**
 * Calculate total KV cache memory for all sessions
 */
export function calculateTotalKVCache(
  tokensPerSession: number,
  bytesPerToken: number,
  numSessions: number
): number {
  return (tokensPerSession * bytesPerToken * numSessions) / 1e9; // Returns GB
}

/**
 * OVERHEAD CALCULATIONS
 */

export interface OverheadCalculation {
  prefillOverhead: number;
  attentionOverhead: number;
  totalMultiplier: number;
  breakdown: string[];
}

/**
 * Calculate all overhead factors and return unified result
 */
export function calculateOverheads(
  prefillTokens: number,
  sequenceLength: number,
  prefillThreshold: number = 100,
  attentionThreshold: number = 2000
): OverheadCalculation {
  const breakdown: string[] = [];
  
  // Prefill overhead
  let prefillOverhead = 0;
  if (prefillTokens > prefillThreshold) {
    prefillOverhead = Math.min(0.30, (prefillTokens / 1000) * 0.15);
    breakdown.push(`+${(prefillOverhead * 100).toFixed(0)}% prefill`);
  }
  
  // Attention overhead
  let attentionOverhead = 0;
  if (sequenceLength > attentionThreshold) {
    attentionOverhead = Math.min(0.40, ((sequenceLength - attentionThreshold) / 10000) * 0.20);
    breakdown.push(`+${(attentionOverhead * 100).toFixed(0)}% attention`);
  }
  
  // Redundancy
  breakdown.push('+15% redundancy');
  
  const totalMultiplier = (1 + prefillOverhead) * (1 + attentionOverhead) * REDUNDANCY_FACTOR;
  
  return {
    prefillOverhead,
    attentionOverhead,
    totalMultiplier,
    breakdown
  };
}

/**
 * BATCHING CALCULATIONS
 */

/**
 * Get optimal batch size based on model parameters
 */
export function getOptimalBatchSize(modelParams: number): number {
  if (modelParams >= 65) return 48;  // 70B+ models: 32-64
  if (modelParams >= 30) return 32;  // 30-65B: 24-48
  if (modelParams >= 10) return 24;  // 10-30B: 16-32
  return 16;                         // <10B: 16-24
}

/**
 * Calculate maximum batch size based on available VRAM
 */
export function calculateMaxBatchSize(
  availableVRAM: number,
  memoryPerRequest: number,
  hardLimit: number = 128
): number {
  if (memoryPerRequest <= 0 || availableVRAM <= 0) return hardLimit;
  return Math.min(Math.floor(availableVRAM / memoryPerRequest), hardLimit);
}

/**
 * Calculate batch efficiency (0-1 scale)
 */
export function calculateBatchEfficiency(actualSize: number, optimalSize: number): number {
  return Math.min(1.0, actualSize / optimalSize);
}

/**
 * UTILITY FUNCTIONS
 */

/**
 * Format large numbers with appropriate units
 */
export function formatFLOPS(value: number): string {
  if (value >= 1e15) return `${(value / 1e15).toFixed(2)} PFLOPS`;
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)} TFLOPS`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)} GFLOPS`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)} MFLOPS`;
  return `${value.toFixed(2)} FLOPS`;
}

/**
 * Format memory with appropriate units
 */
export function formatMemory(valueGB: number): string {
  if (valueGB >= 1000) return `${(valueGB / 1000).toFixed(2)} TB`;
  if (valueGB >= 1) return `${valueGB.toFixed(1)} GB`;
  return `${(valueGB * 1024).toFixed(0)} MB`;
}

/**
 * Format percentage with sign
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format number with thousands separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
