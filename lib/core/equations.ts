/**
 * Unified Core Equations
 * 
 * This is the SINGLE SOURCE OF TRUTH for all calculation equations.
 * Both Capacity Planner and Performance Calculator MUST use these functions.
 * 
 * No other file should implement these formulas.
 */

import {
    FLOPS_MULTIPLIERS,
    OVERHEAD_LIMITS,
    CAPACITY,
    EFFICIENCY,
    MEMORY,
    QUANTIZATION,
    type QuantType,
    type QuantEfficiencyType,
} from './constants';
import { getModelArchitecture, getActiveParameters } from '../modelArchitectures';

// ============================================================================
// FLOPS PER TOKEN CALCULATIONS
// ============================================================================

/**
 * Get FLOPs multiplier based on model size and device type
 */
export function getFlopsMultiplier(
    modelParamsBillions: number,
    device: 'gpu' | 'cpu' = 'gpu'
): number {
    const multipliers = device === 'cpu' ? FLOPS_MULTIPLIERS.CPU : FLOPS_MULTIPLIERS.GPU;

    if (modelParamsBillions < 10) return multipliers.SMALL;
    if (modelParamsBillions < 70) return multipliers.MEDIUM;
    if (modelParamsBillions < 200) return multipliers.LARGE;
    return multipliers.XLARGE;
}

/**
 * Calculate effective parameters for MoE models
 */
export function calculateEffectiveParams(
    totalParams: number,
    isMoE: boolean = false,
    activeExperts: number = 1,
    totalExperts: number = 1
): number {
    if (!isMoE) return totalParams;
    return totalParams * (activeExperts / totalExperts);
}

/**
 * Calculate FLOPs required per token for prefill phase
 * 
 * Prefill processes all input tokens in parallel (compute-bound)
 */
export function calculatePrefillFlopsPerToken(
    modelParamsBillions: number,
    modelName?: string,
    device: 'gpu' | 'cpu' = 'gpu'
): number {
    const architecture = getModelArchitecture(modelParamsBillions, modelName);
    const effectiveParams = calculateEffectiveParams(
        modelParamsBillions,
        architecture.isMoE || false,
        architecture.activeExperts || 1,
        architecture.totalExperts || 1
    );
    const multiplier = getFlopsMultiplier(modelParamsBillions, device);

    // FLOPs per token = multiplier × effective_params × 1e9
    return multiplier * effectiveParams * MEMORY.BILLION;
}

/**
 * Calculate FLOPs required per token for decode phase
 * 
 * Decode generates tokens one at a time (memory-bound for small batches)
 */
export function calculateDecodeFlopsPerToken(
    modelParamsBillions: number,
    modelName?: string,
    device: 'gpu' | 'cpu' = 'gpu',
    sequenceLength?: number
): number {
    const architecture = getModelArchitecture(modelParamsBillions, modelName);
    const effectiveParams = calculateEffectiveParams(
        modelParamsBillions,
        architecture.isMoE || false,
        architecture.activeExperts || 1,
        architecture.totalExperts || 1
    );

    let multiplier = getFlopsMultiplier(modelParamsBillions, device);

    // For decode with long contexts, attention FLOPs scale with sequence length
    if (sequenceLength && sequenceLength > 1024) {
        if (modelParamsBillions >= 50) {
            multiplier = Math.max(multiplier, 10);
        } else if (modelParamsBillions >= 20) {
            multiplier = Math.max(multiplier, 8);
        }
    }

    return multiplier * effectiveParams * MEMORY.BILLION;
}

// ============================================================================
// EFFECTIVE HARDWARE CAPACITY
// ============================================================================

/**
 * Calculate effective FLOPs available from hardware
 * 
 * effectiveFlops = peakFlops × kernelEfficiency × utilizationFactor
 */
export function calculateEffectiveFlops(
    peakFlops: number,
    kernelEfficiency: number = EFFICIENCY.DEFAULT_KERNEL_EFFICIENCY,
    utilizationFactor: number = EFFICIENCY.DEFAULT_UTILIZATION_FACTOR
): number {
    return peakFlops * kernelEfficiency * utilizationFactor;
}

// ============================================================================
// OVERHEAD CALCULATIONS
// ============================================================================

/**
 * Calculate prefill overhead based on input token count
 * 
 * Longer inputs require more prefill compute
 */
export function calculatePrefillOverhead(prefillTokens: number): number {
    if (prefillTokens <= OVERHEAD_LIMITS.PREFILL_THRESHOLD) return 0;

    return Math.min(
        OVERHEAD_LIMITS.MAX_PREFILL_OVERHEAD,
        (prefillTokens / OVERHEAD_LIMITS.PREFILL_SCALING) * 0.15
    );
}

/**
 * Calculate attention overhead based on sequence length
 * 
 * Attention is O(n²), so longer sequences add significant overhead
 */
export function calculateAttentionOverhead(sequenceLength: number): number {
    if (sequenceLength <= OVERHEAD_LIMITS.ATTENTION_THRESHOLD) return 0;

    return Math.min(
        OVERHEAD_LIMITS.MAX_ATTENTION_OVERHEAD,
        ((sequenceLength - OVERHEAD_LIMITS.ATTENTION_THRESHOLD) / OVERHEAD_LIMITS.ATTENTION_SCALING) * 0.20
    );
}

/**
 * Calculate total overhead multiplier
 * 
 * Uses ADDITIVE overhead model: 1 + overhead_a + overhead_b
 * This is the canonical formula used by both calculators.
 */
export function calculateTotalOverheadMultiplier(
    attentionOverhead: number,
    prefillOverhead: number
): number {
    return 1 + attentionOverhead + prefillOverhead;
}

// ============================================================================
// PER-USER FLOPS CALCULATIONS
// ============================================================================

/**
 * Calculate total FLOPs per second required to serve one user
 * 
 * This is the CORE EQUATION that ensures mathematical alignment between:
 * - Capacity Planner: users → FLOPs → GPUs
 * - Performance Calculator: GPUs → FLOPs → users
 * 
 * Formula:
 * flops_per_user = (decode_flops + prefill_flops) × overhead_multiplier
 * 
 * Where:
 * - decode_flops = tokens_per_sec × decode_flops_per_token
 * - prefill_flops = prefill_flops_per_request × requests_per_sec
 * - requests_per_sec = tokens_per_sec / avg_response_tokens
 */
export function calculateFlopsPerUserPerSec(
    decodeFlopsPerToken: number,
    prefillFlopsPerToken: number,
    tokensPerSecPerUser: number,
    avgResponseTokens: number,
    newInputTokens: number,
    attentionOverhead: number,
    prefillOverhead: number
): number {
    // Decode FLOPs: continuous token generation
    const decodeFlopsPerSecPerUser = tokensPerSecPerUser * decodeFlopsPerToken;

    // Prefill FLOPs: triggered on each request
    const requestsPerSecPerUser = avgResponseTokens > 0
        ? tokensPerSecPerUser / avgResponseTokens
        : 0;
    const prefillFlopsPerRequest = newInputTokens * prefillFlopsPerToken;
    const prefillFlopsPerSecPerUser = prefillFlopsPerRequest * requestsPerSecPerUser;

    // Total with overhead
    const baseFlops = decodeFlopsPerSecPerUser + prefillFlopsPerSecPerUser;
    const overheadMultiplier = calculateTotalOverheadMultiplier(attentionOverhead, prefillOverhead);

    return baseFlops * overheadMultiplier;
}

// ============================================================================
// USER CAPACITY CALCULATIONS
// ============================================================================

/**
 * Calculate maximum users that can be served by given FLOPs
 * 
 * This is the INVERSE of calculateFlopsPerUserPerSec
 * maxUsers = totalSystemFlops / flopsPerUserPerSec
 */
export function calculateMaxUsersFromFlops(
    totalSystemFlops: number,
    flopsPerUserPerSec: number
): number {
    if (flopsPerUserPerSec <= 0) return 0;
    return totalSystemFlops / flopsPerUserPerSec;
}

/**
 * Calculate minimum units (GPUs) required to serve N users
 * 
 * This is the INVERSE of calculateMaxUsersFromFlops
 * minUnits = ceil((users × flopsPerUser) / effectiveFlopsPerUnit × (1 + headroom))
 */
export function calculateMinUnitsForUsers(
    numUsers: number,
    flopsPerUserPerSec: number,
    effectiveFlopsPerUnit: number,
    headroom: number = CAPACITY.DEFAULT_HEADROOM
): number {
    if (effectiveFlopsPerUnit <= 0) return 1;

    const requiredFlops = numUsers * flopsPerUserPerSec;
    const capacityMultiplier = 1 + headroom;

    return Math.ceil((requiredFlops / effectiveFlopsPerUnit) * capacityMultiplier);
}

// ============================================================================
// MEMORY CALCULATIONS
// ============================================================================

/**
 * Calculate model size in GB
 */
export function calculateModelSizeGB(
    modelParamsBillions: number,
    quantType: QuantType = 'fp16',
    modelName?: string
): number {
    const bytesPerParam = QUANTIZATION.BYTES_PER_PARAM[quantType] ?? 2;
    const architecture = getModelArchitecture(modelParamsBillions, modelName);

    // For MoE, we need to load all expert weights
    const effectiveParams = architecture.isMoE
        ? modelParamsBillions
        : modelParamsBillions;

    return (effectiveParams * MEMORY.BILLION * bytesPerParam) / MEMORY.BILLION;
}

/**
 * Calculate KV cache bytes per token per user
 */
export function calculateKVBytesPerToken(
    modelParamsBillions: number,
    quantType: QuantType = 'fp16',
    modelName?: string
): number {
    const architecture = getModelArchitecture(modelParamsBillions, modelName);
    const numLayers = architecture.layers || Math.ceil(modelParamsBillions * 0.8);
    const hiddenSize = architecture.hiddenSize || Math.ceil(modelParamsBillions * 128);
    // Use kvHeads for KV cache size (GQA optimization)
    const kvHeads = architecture.kvHeads || architecture.queryHeads || Math.ceil(hiddenSize / 128);
    const queryHeads = architecture.queryHeads || architecture.kvHeads || Math.ceil(hiddenSize / 128);
    const headDim = Math.ceil(hiddenSize / queryHeads);

    const bytesPerElement = QUANTIZATION.BYTES_PER_PARAM[quantType] ?? 2;

    // KV cache: 2 (K and V) × layers × kvHeads × headDim × bytesPerElement
    return 2 * numLayers * kvHeads * headDim * bytesPerElement;
}

/**
 * Calculate total KV cache memory for all users
 */
export function calculateTotalKVCacheGB(
    numUsers: number,
    sessionTokens: number,
    kvBytesPerToken: number,
    activeKvFraction: number = 1.0,
    offloadRatio: number = 0
): { totalGB: number; inVramGB: number; offloadedGB: number } {
    const totalSize = (numUsers * sessionTokens * kvBytesPerToken) / MEMORY.BILLION;
    const activeSize = totalSize * activeKvFraction;
    const inVramSize = activeSize * (1 - offloadRatio);
    const offloadedSize = activeSize * offloadRatio;

    return {
        totalGB: totalSize,
        inVramGB: inVramSize,
        offloadedGB: offloadedSize,
    };
}

/**
 * Calculate VRAM requirements per GPU
 */
export function calculateVRAMRequirements(
    modelSizeGB: number,
    kvCacheInVramGB: number,
    numGpus: number = 1
): { modelGB: number; kvGB: number; activationsGB: number; safetyGB: number; totalGB: number } {
    const activationsGB = modelSizeGB * CAPACITY.ACTIVATIONS_RATIO;
    const kvPerGpu = numGpus > 0 ? kvCacheInVramGB / numGpus : kvCacheInVramGB;
    const subtotal = modelSizeGB + kvPerGpu + activationsGB;
    const safetyGB = subtotal * CAPACITY.VRAM_SAFETY_BUFFER;

    return {
        modelGB: modelSizeGB,
        kvGB: kvPerGpu,
        activationsGB,
        safetyGB,
        totalGB: subtotal + safetyGB,
    };
}

/**
 * Calculate minimum GPUs needed to fit VRAM requirements
 */
export function calculateMinGpusForVRAM(
    modelSizeGB: number,
    totalKvCacheInVramGB: number,
    vramPerGpu: number
): number {
    const activationsGB = modelSizeGB * CAPACITY.ACTIVATIONS_RATIO;
    let gpuCount = 1;

    // Iterate to find minimum GPUs where per-GPU requirements fit
    while (gpuCount <= 10000) {
        const kvPerGpu = totalKvCacheInVramGB / gpuCount;
        const subtotal = modelSizeGB + kvPerGpu + activationsGB;
        const safetyGB = subtotal * CAPACITY.VRAM_SAFETY_BUFFER;
        const totalPerGpu = subtotal + safetyGB;

        if (totalPerGpu <= vramPerGpu) {
            return gpuCount;
        }
        gpuCount++;
    }

    return gpuCount; // Safety limit
}

// ============================================================================
// QUANTIZATION HELPERS
// ============================================================================

/**
 * Get quantization efficiency factor
 */
export function getQuantizationEfficiency(quantType: QuantEfficiencyType): number {
    return QUANTIZATION.EFFICIENCY[quantType] ?? 1.0;
}

/**
 * Normalize quantization type string to canonical form
 */
export function normalizeQuantType(quantType: string): QuantEfficiencyType {
    const normalized = quantType.toLowerCase().replace(/[-_]/g, '');
    if (normalized.includes('fp16') || normalized.includes('bf16')) return 'fp16';
    if (normalized.includes('int8') || normalized.includes('8bit')) return 'int8';
    if (normalized.includes('int4') || normalized.includes('4bit') || normalized.includes('q4')) return 'int4';
    return 'fp16';
}
