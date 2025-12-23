/**
 * Unified Core Types
 * 
 * Shared type definitions for the core calculation engine.
 */

import type { QuantEfficiencyType } from './constants';

// ============================================================================
// CORE INPUT/OUTPUT INTERFACES
// ============================================================================

/**
 * Unified inputs for both Capacity Planner and Performance Calculator
 * 
 * The core engine accepts this interface and determines the calculation mode
 * based on which fields are provided:
 * - If `numUsers` is provided → Capacity Planning mode (calculate required GPUs)
 * - If `numUnits` is provided → Performance mode (calculate max users)
 */
export interface CoreInputs {
    // ========== Model Configuration ==========
    /** Model parameters in billions */
    modelParams: number;
    /** Quantization type */
    quantType: QuantEfficiencyType;
    /** Model name for architecture lookup (optional) */
    modelName?: string;
    /** Whether using custom model parameters */
    useCustomModel?: boolean;

    // ========== Hardware Configuration (per unit) ==========
    /** Peak FLOPs per GPU/CPU in FLOPs/second */
    peakFlops: number;
    /** VRAM per GPU in GB */
    vramPerUnit: number;
    /** Device type */
    device: 'gpu' | 'cpu';

    // ========== Efficiency Factors ==========
    /** Kernel efficiency (0-1) - how well kernels utilize hardware */
    kernelEfficiency: number;
    /** Utilization factor (0-1) - sustained utilization over time */
    utilizationFactor: number;

    // ========== Overhead Factors (fractional) ==========
    /** Attention overhead as fraction (e.g., 0.1 = 10%) */
    attentionOverhead: number;
    /** Prefill overhead as fraction (e.g., 0.1 = 10%) */
    prefillOverhead: number;

    // ========== Serving Parameters ==========
    /** Tokens per second per user */
    tokensPerSecPerUser: number;
    /** Average response tokens per request */
    avgResponseTokensPerRequest: number;
    /** New input tokens per request */
    newInputTokensPerRequest: number;

    // ========== KV Cache Parameters ==========
    /** System prompt tokens per session */
    systemPromptTokens: number;
    /** Session history tokens */
    sessionHistoryTokens: number;
    /** Fraction of users with active KV in memory (0-1) */
    activeKvFraction: number;
    /** Fraction of KV cache offloaded to CPU/NVMe (0-1) */
    offloadRatio: number;

    // ========== Capacity Planning ==========
    /** Target headroom as fraction (e.g., 0.1 = 10%) */
    targetHeadroom: number;

    // ========== Mode Selection (provide ONE of these) ==========
    /** Number of concurrent users - for Capacity Planning mode */
    numUsers?: number;
    /** Number of hardware units - for Performance mode */
    numUnits?: number;
}

/**
 * Results from the core calculation engine
 * 
 * Contains all computed values that both UIs need.
 */
export interface CoreResults {
    // ========== Mode ==========
    /** Calculation mode that was used */
    mode: 'capacity' | 'performance';

    // ========== Primary Outputs ==========
    /** Number of hardware units (GPUs/CPUs) required or specified */
    units: number;
    /** Maximum users this configuration can support */
    maxUsers: number;
    /** Maximum system throughput in tokens/second */
    maxThroughput: number;

    // ========== FLOPs Breakdown ==========
    /** FLOPs per token for decode phase */
    decodeFlopsPerToken: number;
    /** FLOPs per token for prefill phase */
    prefillFlopsPerToken: number;
    /** FLOPs per second per user (with overheads) */
    flopsPerUserPerSec: number;
    /** Effective FLOPs per unit (after efficiency factors) */
    effectiveFlopsPerUnit: number;
    /** Total system FLOPs available */
    totalSystemFlops: number;
    /** Total FLOPs required for workload */
    requiredFlops: number;

    // ========== GPU Count Breakdown (Capacity mode) ==========
    /** GPUs needed for compute requirements */
    unitsForCompute: number;
    /** GPUs needed for memory requirements */
    unitsForMemory: number;

    // ========== Memory Breakdown ==========
    /** Model size in GB */
    modelSizeGB: number;
    /** Total KV cache required in GB */
    totalKvCacheGB: number;
    /** KV cache in VRAM per GPU in GB */
    kvCacheInVramPerUnitGB: number;
    /** VRAM required per GPU in GB */
    requiredVramPerUnit: number;

    // ========== Overhead Information ==========
    /** Total overhead multiplier applied */
    totalOverheadMultiplier: number;
    /** Attention overhead percentage */
    attentionOverheadPercent: number;
    /** Prefill overhead percentage */
    prefillOverheadPercent: number;

    // ========== Capacity Information ==========
    /** Headroom percentage */
    headroomPercent: number;
    /** System utilization percentage */
    utilizationPercent: number;

    // ========== Intermediate Values (for debugging/display) ==========
    /** Decode FLOPs per second (system total) */
    decodeFlopsPerSec: number;
    /** Prefill FLOPs per second (system total) */
    prefillFlopsPerSec: number;
    /** Tokens per second (system total) */
    systemTokensPerSec: number;
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Mapping function type for converting legacy inputs to CoreInputs
 */
export type LegacyInputMapper<T> = (legacyInputs: T) => CoreInputs;

/**
 * Mapping function type for converting CoreResults to legacy output format
 */
export type LegacyOutputMapper<T> = (coreResults: CoreResults) => T;
