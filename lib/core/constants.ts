/**
 * Unified Core Constants
 * 
 * This is the SINGLE SOURCE OF TRUTH for all calculation constants.
 * No other file should define these values.
 */

// ============================================================================
// FLOPS MULTIPLIERS
// ============================================================================
// These represent the ratio of FLOPs per token to model parameters.
// Based on transformer architecture: ~2 FLOPs per parameter for matrix multiply,
// plus additional overhead for attention, normalization, etc.

export const FLOPS_MULTIPLIERS = {
    GPU: {
        SMALL: 2.3,    // <10B params - lower overhead
        MEDIUM: 3.0,   // 10-70B params
        LARGE: 4.0,    // 70-200B params
        XLARGE: 5.5,   // >200B params - highest overhead
    },
    CPU: {
        SMALL: 2.0,    // <10B params
        MEDIUM: 2.15,  // 10-70B params
        LARGE: 2.45,   // 70-200B params
        XLARGE: 2.8,   // >200B params
    },
} as const;

// ============================================================================
// OVERHEAD LIMITS
// ============================================================================
// Maximum overhead factors to prevent unrealistic estimates

export const OVERHEAD_LIMITS = {
    MAX_PREFILL_OVERHEAD: 0.30,    // 30% max prefill overhead
    MAX_ATTENTION_OVERHEAD: 0.40,  // 40% max attention overhead
    PREFILL_THRESHOLD: 100,        // Token count above which prefill overhead applies
    ATTENTION_THRESHOLD: 2000,     // Sequence length above which attention overhead scales
    PREFILL_SCALING: 1000,         // Divisor for prefill overhead calculation
    ATTENTION_SCALING: 10000,      // Divisor for attention overhead calculation
} as const;

// ============================================================================
// CAPACITY PLANNING
// ============================================================================

export const CAPACITY = {
    DEFAULT_HEADROOM: 0.10,        // 10% default capacity buffer
    DEFAULT_REDUNDANCY: 0.15,      // 15% redundancy factor (deprecated - use headroom)
    VRAM_SAFETY_BUFFER: 0.10,      // 10% VRAM safety margin
    ACTIVATIONS_RATIO: 0.20,       // Activations ~20% of model size
} as const;

// ============================================================================
// EFFICIENCY DEFAULTS
// ============================================================================

export const EFFICIENCY = {
    DEFAULT_KERNEL_EFFICIENCY: 0.50,     // 50% default kernel efficiency
    DEFAULT_UTILIZATION_FACTOR: 0.80,    // 80% default utilization
    DEFAULT_CPU_UTILIZATION: 0.25,       // 25% default CPU utilization
    DEFAULT_CPU_AMX_EFFICIENCY: 0.50,    // 50% AMX efficiency
} as const;

// ============================================================================
// SERVING PARAMETERS
// ============================================================================

export const SERVING = {
    DEFAULT_TOKENS_PER_SEC_PER_USER: 10,  // 10 tokens/sec per user
    DEFAULT_AVG_RESPONSE_TOKENS: 50,      // 50 tokens average response
    DEFAULT_INPUT_TOKENS: 100,            // 100 input tokens per request
    DEFAULT_REQUEST_FREQUENCY: 1 / 60,    // 1 request per minute per user
} as const;

// ============================================================================
// WORKLOAD WEIGHTS
// ============================================================================
// For continuous serving, decode dominates (users are reading output)

export const WORKLOAD_WEIGHTS = {
    DECODE_WEIGHT: 0.95,   // 95% of workload is decode
    PREFILL_WEIGHT: 0.05,  // 5% of workload is prefill
} as const;

// ============================================================================
// MEMORY CONSTANTS
// ============================================================================

export const MEMORY = {
    MODEL_SIZE_OVERHEAD: 1.2,       // 20% overhead for model weights in memory
    ATTENTION_BUFFER_GB: 2.0,       // 2GB attention buffer
    KV_BYTES_MULTIPLIER: 2,         // 2 bytes per KV element for fp16
    BILLION: 1e9,
} as const;

// ============================================================================
// QUANTIZATION PARAMETERS
// ============================================================================

export const QUANTIZATION = {
    BYTES_PER_PARAM: {
        fp32: 4,
        fp16: 2,
        bf16: 2,
        fp8: 1,
        int8: 1,
        int4: 0.5,
        q4_k_s: 0.5,
    } as const,

    EFFICIENCY: {
        fp16: 0.95,
        int8: 0.88,
        int4: 0.80,
    } as const,

    MEMORY_BANDWIDTH: {
        // GB/s memory bandwidth by hardware type
        fp16: { h100: 3350, h200: 4800, a100: 2000, a6000: 768, default: 1000 },
        int8: { h100: 3350, h200: 4800, a100: 2000, a6000: 768, default: 1000 },
        int4: { h100: 3350, h200: 4800, a100: 2000, a6000: 768, default: 1000 },
    } as const,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type QuantType = keyof typeof QUANTIZATION.BYTES_PER_PARAM;
export type QuantEfficiencyType = keyof typeof QUANTIZATION.EFFICIENCY;
