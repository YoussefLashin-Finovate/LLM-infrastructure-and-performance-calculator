/**
 * Calculator Validation Module
 * 
 * Provides utilities for verifying mathematical alignment between
 * Capacity Planner and Performance Calculator.
 * 
 * INVARIANT: If using identical inputs, then:
 *   performance(capacity(N users).gpuCount) >= N users
 */

import { calculateCore, type CoreInputs, type CoreResults } from './core';
import { EFFICIENCY, SERVING, CAPACITY } from './constants';

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface AlignmentTestCase {
    name: string;
    users: number;
    config: Partial<CoreInputs>;
}

export interface AlignmentResult {
    testCase: string;
    aligned: boolean;
    requestedUsers: number;
    calculatedUnits: number;
    maxUsers: number;
    ratio: number;
    flopsPerUser: number;
    effectiveFlopsPerUnit: number;
}

export interface ValidationSummary {
    passed: boolean;
    passCount: number;
    failCount: number;
    results: AlignmentResult[];
}

// ============================================================================
// DEFAULT TEST CONFIGURATION
// ============================================================================

const DEFAULT_TEST_CONFIG: CoreInputs = {
    modelParams: 70,
    quantType: 'int8',
    peakFlops: 1.98e15, // H100
    vramPerUnit: 80,
    device: 'gpu',
    kernelEfficiency: EFFICIENCY.DEFAULT_KERNEL_EFFICIENCY,
    utilizationFactor: EFFICIENCY.DEFAULT_UTILIZATION_FACTOR,
    attentionOverhead: 0.1,
    prefillOverhead: 0.1,
    tokensPerSecPerUser: SERVING.DEFAULT_TOKENS_PER_SEC_PER_USER,
    avgResponseTokensPerRequest: SERVING.DEFAULT_AVG_RESPONSE_TOKENS,
    newInputTokensPerRequest: SERVING.DEFAULT_INPUT_TOKENS,
    systemPromptTokens: 0,
    sessionHistoryTokens: 0,
    activeKvFraction: 0.05,
    offloadRatio: 0,
    targetHeadroom: CAPACITY.DEFAULT_HEADROOM,
};

// ============================================================================
// CORE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate alignment between capacity and performance calculations
 * 
 * Ensures that:
 *   capacity(N users) → K units
 *   performance(K units) → maxUsers >= N
 */
export function validateAlignment(
    users: number,
    config: Partial<CoreInputs> = {}
): AlignmentResult {
    const mergedConfig = { ...DEFAULT_TEST_CONFIG, ...config };

    // Step 1: Run capacity mode (users → units)
    const capacityResult = calculateCore({
        ...mergedConfig,
        numUsers: users,
    });

    // Step 2: Run performance mode (units → users)
    const performanceResult = calculateCore({
        ...mergedConfig,
        numUnits: capacityResult.units,
    });

    // Step 3: Check alignment
    const aligned = performanceResult.maxUsers >= users;
    const ratio = performanceResult.maxUsers / users;

    return {
        testCase: `${users} users`,
        aligned,
        requestedUsers: users,
        calculatedUnits: capacityResult.units,
        maxUsers: performanceResult.maxUsers,
        ratio,
        flopsPerUser: capacityResult.flopsPerUserPerSec,
        effectiveFlopsPerUnit: capacityResult.effectiveFlopsPerUnit,
    };
}

/**
 * Run a batch of alignment tests
 */
export function runAlignmentTests(
    testCases: AlignmentTestCase[]
): ValidationSummary {
    const results: AlignmentResult[] = [];
    let passCount = 0;
    let failCount = 0;

    for (const testCase of testCases) {
        const result = validateAlignment(testCase.users, testCase.config);
        result.testCase = testCase.name;
        results.push(result);

        if (result.aligned) {
            passCount++;
        } else {
            failCount++;
        }
    }

    return {
        passed: failCount === 0,
        passCount,
        failCount,
        results,
    };
}

/**
 * Run standard alignment tests
 */
export function runStandardAlignmentTests(): ValidationSummary {
    const testCases: AlignmentTestCase[] = [
        { name: '50 users baseline', users: 50, config: {} },
        { name: '100 users baseline', users: 100, config: {} },
        { name: '200 users baseline', users: 200, config: {} },
        { name: '500 users baseline', users: 500, config: {} },
        { name: '1000 users baseline', users: 1000, config: {} },
        { name: '100 users / 7B model', users: 100, config: { modelParams: 7 } },
        { name: '100 users / 405B model', users: 100, config: { modelParams: 405 } },
        { name: '100 users / high headroom', users: 100, config: { targetHeadroom: 0.3 } },
        { name: '100 users / low efficiency', users: 100, config: { kernelEfficiency: 0.3 } },
    ];

    return runAlignmentTests(testCases);
}

// ============================================================================
// CONSISTENCY CHECKS
// ============================================================================

/**
 * Verify that all UI parameters are consumed by the calculation
 * 
 * Returns a list of parameters that may not be properly consumed.
 */
export function auditParameterConsumption(): string[] {
    const warnings: string[] = [];

    // Parameters that MUST affect results
    const criticalParams: (keyof CoreInputs)[] = [
        'modelParams',
        'quantType',
        'peakFlops',
        'vramPerUnit',
        'kernelEfficiency',
        'utilizationFactor',
        'attentionOverhead',
        'prefillOverhead',
        'tokensPerSecPerUser',
        'avgResponseTokensPerRequest',
        'newInputTokensPerRequest',
        'targetHeadroom',
    ];

    const baseConfig = { ...DEFAULT_TEST_CONFIG, numUsers: 100 };
    const baseResult = calculateCore(baseConfig);

    for (const param of criticalParams) {
        // Test by modifying the parameter
        const modifiedConfig = { ...baseConfig };
        const originalValue = modifiedConfig[param];

        // Skip non-numeric params for now
        if (typeof originalValue !== 'number') continue;

        // Increase by 50%
        (modifiedConfig as unknown as Record<string, number>)[param] = originalValue * 1.5;
        const modifiedResult = calculateCore(modifiedConfig);

        // Check if result changed
        if (
            modifiedResult.units === baseResult.units &&
            modifiedResult.maxUsers === baseResult.maxUsers &&
            Math.abs(modifiedResult.flopsPerUserPerSec - baseResult.flopsPerUserPerSec) < 1
        ) {
            warnings.push(`Parameter '${param}' may not affect calculation results`);
        }
    }

    return warnings;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    DEFAULT_TEST_CONFIG,
};
