/**
 * Unified Core Calculation Engine
 * 
 * This is the SINGLE calculation engine used by both:
 * - Capacity Planner (users → GPUs)
 * - Performance Calculator (GPUs → users)
 * 
 * Both calculators are mathematical inverses of each other when using
 * the same equations and assumptions. This module ensures that by:
 * 1. Using a single set of equations (from ./equations.ts)
 * 2. Using a single set of constants (from ./constants.ts)
 * 3. Accepting unified inputs (from ./types.ts)
 * 
 * MATHEMATICAL PRINCIPLE:
 * If capacity_planner(N users) = K GPUs
 * Then performance_calculator(K GPUs) = N users (approximately, due to ceiling effects)
 */

import type { CoreInputs, CoreResults } from './types';
import {
    calculateDecodeFlopsPerToken,
    calculatePrefillFlopsPerToken,
    calculateEffectiveFlops,
    calculateFlopsPerUserPerSec,
    calculateMaxUsersFromFlops,
    calculateMinUnitsForUsers,
    calculateModelSizeGB,
    calculateKVBytesPerToken,
    calculateTotalKVCacheGB,
    calculateMinGpusForVRAM,
    calculateVRAMRequirements,
    calculateTotalOverheadMultiplier,
} from './equations';
import { EFFICIENCY, SERVING, CAPACITY } from './constants';

/**
 * Main calculation engine
 * 
 * Determines mode based on inputs:
 * - numUsers provided, numUnits undefined → Capacity Planning
 * - numUnits provided, numUsers undefined → Performance Calculation
 * - Both provided → Performance mode (uses numUnits, calculates maxUsers)
 */
export function calculateCore(inputs: CoreInputs): CoreResults {
    // Determine calculation mode
    const mode: 'capacity' | 'performance' =
        (inputs.numUnits !== undefined) ? 'performance' : 'capacity';

    // Apply defaults
    const {
        modelParams,
        quantType,
        modelName,
        peakFlops,
        vramPerUnit,
        device = 'gpu',
        kernelEfficiency = EFFICIENCY.DEFAULT_KERNEL_EFFICIENCY,
        utilizationFactor = EFFICIENCY.DEFAULT_UTILIZATION_FACTOR,
        attentionOverhead,
        prefillOverhead,
        tokensPerSecPerUser = SERVING.DEFAULT_TOKENS_PER_SEC_PER_USER,
        avgResponseTokensPerRequest = SERVING.DEFAULT_AVG_RESPONSE_TOKENS,
        newInputTokensPerRequest = SERVING.DEFAULT_INPUT_TOKENS,
        systemPromptTokens = 0,
        sessionHistoryTokens = 0,
        activeKvFraction = 1.0,
        offloadRatio = 0,
        targetHeadroom = CAPACITY.DEFAULT_HEADROOM,
        numUsers,
        numUnits,
    } = inputs;

    // ========================================================================
    // STEP 1: Calculate FLOPs per token
    // ========================================================================

    const decodeFlopsPerToken = calculateDecodeFlopsPerToken(
        modelParams,
        modelName,
        device
    );

    const prefillFlopsPerToken = calculatePrefillFlopsPerToken(
        modelParams,
        modelName,
        device
    );

    // ========================================================================
    // STEP 2: Calculate FLOPs per user per second
    // ========================================================================

    const flopsPerUserPerSec = calculateFlopsPerUserPerSec(
        decodeFlopsPerToken,
        prefillFlopsPerToken,
        tokensPerSecPerUser,
        avgResponseTokensPerRequest,
        newInputTokensPerRequest,
        attentionOverhead,
        prefillOverhead
    );

    // ========================================================================
    // STEP 3: Calculate effective FLOPs per hardware unit
    // ========================================================================

    const effectiveFlopsPerUnit = calculateEffectiveFlops(
        peakFlops,
        kernelEfficiency,
        utilizationFactor
    );

    // ========================================================================
    // STEP 4: Calculate memory requirements
    // ========================================================================

    const modelSizeGB = calculateModelSizeGB(modelParams, quantType, modelName);

    const totalSessionTokens = systemPromptTokens + sessionHistoryTokens + newInputTokensPerRequest;
    const kvBytesPerToken = calculateKVBytesPerToken(modelParams, quantType, modelName);

    // ========================================================================
    // STEP 5: Mode-specific calculations
    // ========================================================================

    let units: number;
    let maxUsers: number;
    let unitsForCompute: number;
    let unitsForMemory: number;
    let totalKvCacheGB: number;
    let kvCacheInVramPerUnitGB: number;

    if (mode === 'capacity') {
        // CAPACITY PLANNING: Given users, find required GPUs
        const targetUsers = numUsers || 1;

        // Calculate KV cache requirements for target users
        const kvCalc = calculateTotalKVCacheGB(
            targetUsers,
            totalSessionTokens,
            kvBytesPerToken,
            activeKvFraction,
            offloadRatio
        );
        totalKvCacheGB = kvCalc.totalGB;

        // Calculate compute-limited GPU count
        unitsForCompute = calculateMinUnitsForUsers(
            targetUsers,
            flopsPerUserPerSec,
            effectiveFlopsPerUnit,
            targetHeadroom
        );

        // Calculate memory-limited GPU count
        unitsForMemory = calculateMinGpusForVRAM(
            modelSizeGB,
            kvCalc.inVramGB,
            vramPerUnit
        );

        // Take the maximum (bottleneck constraint)
        units = Math.max(unitsForCompute, unitsForMemory, 1);

        // Calculate max users for this configuration (without headroom for display)
        const totalSystemFlops = effectiveFlopsPerUnit * units;
        maxUsers = Math.floor(calculateMaxUsersFromFlops(totalSystemFlops, flopsPerUserPerSec));

        // Recalculate KV per unit with final unit count
        kvCacheInVramPerUnitGB = units > 0 ? kvCalc.inVramGB / units : 0;

    } else {
        // PERFORMANCE CALCULATION: Given GPUs, find max users
        units = numUnits || 1;
        unitsForCompute = units;
        unitsForMemory = units;

        // Calculate total system FLOPs
        const totalSystemFlops = effectiveFlopsPerUnit * units;

        // Calculate max users
        maxUsers = Math.floor(calculateMaxUsersFromFlops(totalSystemFlops, flopsPerUserPerSec));

        // Calculate KV cache for max users
        const kvCalc = calculateTotalKVCacheGB(
            maxUsers,
            totalSessionTokens,
            kvBytesPerToken,
            activeKvFraction,
            offloadRatio
        );
        totalKvCacheGB = kvCalc.totalGB;
        kvCacheInVramPerUnitGB = units > 0 ? kvCalc.inVramGB / units : 0;
    }

    // ========================================================================
    // STEP 6: Calculate derived values
    // ========================================================================

    const totalSystemFlops = effectiveFlopsPerUnit * units;
    const requiredFlops = (mode === 'capacity' ? numUsers || 1 : maxUsers) * flopsPerUserPerSec;

    // VRAM breakdown
    const vramReq = calculateVRAMRequirements(modelSizeGB, kvCacheInVramPerUnitGB * units, units);

    // Overhead multiplier
    const totalOverheadMultiplier = calculateTotalOverheadMultiplier(attentionOverhead, prefillOverhead);

    // System throughput
    const systemTokensPerSec = maxUsers * tokensPerSecPerUser;
    const maxThroughput = systemTokensPerSec;

    // Decode/prefill breakdown (for display)
    const decodeFlopsPerSecPerUser = tokensPerSecPerUser * decodeFlopsPerToken;
    const requestsPerSecPerUser = avgResponseTokensPerRequest > 0
        ? tokensPerSecPerUser / avgResponseTokensPerRequest
        : 0;
    const prefillFlopsPerSecPerUser = newInputTokensPerRequest * prefillFlopsPerToken * requestsPerSecPerUser;

    const displayUsers = mode === 'capacity' ? (numUsers || 1) : maxUsers;
    const decodeFlopsPerSec = displayUsers * decodeFlopsPerSecPerUser;
    const prefillFlopsPerSec = displayUsers * prefillFlopsPerSecPerUser;

    // ========================================================================
    // RETURN RESULTS
    // ========================================================================

    return {
        mode,

        // Primary outputs
        units,
        maxUsers,
        maxThroughput,

        // FLOPs breakdown
        decodeFlopsPerToken,
        prefillFlopsPerToken,
        flopsPerUserPerSec,
        effectiveFlopsPerUnit,
        totalSystemFlops,
        requiredFlops,

        // GPU count breakdown
        unitsForCompute,
        unitsForMemory,

        // Memory breakdown
        modelSizeGB,
        totalKvCacheGB,
        kvCacheInVramPerUnitGB,
        requiredVramPerUnit: vramReq.totalGB,

        // Overhead information
        totalOverheadMultiplier,
        attentionOverheadPercent: attentionOverhead * 100,
        prefillOverheadPercent: prefillOverhead * 100,

        // Capacity information
        headroomPercent: targetHeadroom * 100,
        utilizationPercent: utilizationFactor * 100,

        // Intermediate values
        decodeFlopsPerSec,
        prefillFlopsPerSec,
        systemTokensPerSec,
    };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Calculate capacity (users → GPUs)
 * 
 * Convenience wrapper for capacity planning mode
 */
export function calculateCapacity(
    inputs: Omit<CoreInputs, 'numUnits'> & { numUsers: number }
): CoreResults {
    return calculateCore({ ...inputs, numUnits: undefined });
}

/**
 * Calculate performance (GPUs → users)
 * 
 * Convenience wrapper for performance calculation mode
 */
export function calculatePerformanceFromCore(
    inputs: Omit<CoreInputs, 'numUsers'> & { numUnits: number }
): CoreResults {
    return calculateCore({ ...inputs, numUsers: undefined });
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from './constants';
export * from './equations';
export * from './types';
