/**
 * Performance Calculator
 * 
 * Calculates: Given N GPUs → How many users can this system support?
 * 
 * This is a thin wrapper around the unified core engine.
 * All actual calculations happen in lib/core/core.ts to ensure
 * mathematical alignment with the Capacity Planner.
 */

import { CalculatorInputs, CalculatorResults } from '../types';
import { calculateCore, type CoreInputs } from '../core';
import { EFFICIENCY, SERVING, CAPACITY } from '../core/constants';
import { normalizeQuantType } from '../core/equations';

/**
 * Map legacy CalculatorInputs to unified CoreInputs
 */
function mapToCore(inputs: CalculatorInputs): CoreInputs {
  const {
    modelParams,
    hardwareOps,
    units = 1,
    kernelEfficiency = EFFICIENCY.DEFAULT_KERNEL_EFFICIENCY,
    utilizationFactor,
    utilization,
    attentionOverhead = 0.1,
    prefillOverhead = 0.1,
    tokensPerSecPerUser = SERVING.DEFAULT_TOKENS_PER_SEC_PER_USER,
    avgResponseTokensPerRequest,
    inputLength = SERVING.DEFAULT_INPUT_TOKENS,
    responseLength = SERVING.DEFAULT_AVG_RESPONSE_TOKENS,
    quantType = 'fp16',
    tokenBreakdown,
    gpuMemoryGB = 96,
    isCPU = false,
    useCustomModel = false,
    customTotalParams = 1,
    offloadRatio = 0,
    activeKvFraction = 1.0,
    targetHeadroom = CAPACITY.DEFAULT_HEADROOM,
    redundancyFactor = CAPACITY.DEFAULT_REDUNDANCY,
  } = inputs;

  // Handle model parameters - if > 1000, assume raw count, divide by 1e9
  const modelParamsBillions = modelParams > 1000 ? modelParams / 1e9 : modelParams;
  const effectiveModelParams = useCustomModel ? customTotalParams : modelParamsBillions;

  // Fallback for utilizationFactor: use utilizationFactor if provided, else utilization, else default
  const effectiveUtilization = utilizationFactor ?? utilization ?? EFFICIENCY.DEFAULT_UTILIZATION_FACTOR;

  // Use token breakdown if available
  const systemPromptTokens = tokenBreakdown?.systemPromptTokens ?? 0;
  const sessionHistoryTokens = tokenBreakdown?.sessionHistoryTokens ?? 0;
  const newInputTokens = tokenBreakdown?.newInputTokens ?? inputLength;
  const avgResponse = avgResponseTokensPerRequest ?? tokenBreakdown?.outputTokens ?? responseLength;

  return {
    modelParams: effectiveModelParams,
    quantType: normalizeQuantType(quantType),
    modelName: useCustomModel ? 'custom' : undefined,
    useCustomModel,
    peakFlops: hardwareOps,
    vramPerUnit: gpuMemoryGB,
    device: isCPU ? 'cpu' : 'gpu',
    kernelEfficiency,
    utilizationFactor: effectiveUtilization,
    attentionOverhead,
    prefillOverhead,
    tokensPerSecPerUser,
    avgResponseTokensPerRequest: avgResponse,
    newInputTokensPerRequest: newInputTokens,
    systemPromptTokens,
    sessionHistoryTokens,
    activeKvFraction,
    offloadRatio,
    targetHeadroom,
    numUnits: units,
  };
}

/**
 * Map CoreResults to legacy CalculatorResults
 */
function mapFromCore(coreResults: ReturnType<typeof calculateCore>, inputs: CalculatorInputs): CalculatorResults {
  const {
    attentionOverhead = 0.1,
    prefillOverhead = 0.1,
    redundancyFactor = CAPACITY.DEFAULT_REDUNDANCY,
    targetHeadroom = CAPACITY.DEFAULT_HEADROOM,
    offloadRatio = 0,
    activeKvFraction = 1.0,
    tokensPerSecPerUser = SERVING.DEFAULT_TOKENS_PER_SEC_PER_USER,
  } = inputs;

  return {
    // Core outputs
    theoretical: coreResults.maxThroughput,
    realistic: coreResults.maxThroughput,
    users: coreResults.maxUsers,
    tokensPerSecPerUser,
    words: coreResults.maxThroughput * 0.75, // Approximate word conversion
    isMemoryBound: false, // Simplified - could be enhanced

    // Overhead factors
    prefillOverhead,
    attentionOverhead,
    redundancyFactor,
    targetHeadroom,
    offloadRatio,
    activeKvFraction,

    // Additional calculated values
    usableFlops: coreResults.totalSystemFlops,
    maxThroughput: coreResults.maxThroughput,
    maxUsers: coreResults.maxUsers,
    totalOverheadMultiplier: coreResults.totalOverheadMultiplier,
    effectiveFlopsPerGpu: coreResults.effectiveFlopsPerUnit,
    flopsPerToken: coreResults.decodeFlopsPerToken,
    decodeFlopsPerToken: coreResults.decodeFlopsPerToken,
    tokenGenerationTime: coreResults.decodeFlopsPerToken > 0
      ? coreResults.decodeFlopsPerToken / coreResults.totalSystemFlops
      : 0,
  };
}

/**
 * Calculate performance metrics for given hardware configuration
 * 
 * Uses the unified core engine to ensure mathematical alignment
 * with the Capacity Planner.
 */
export function calculatePerformance(inputs: CalculatorInputs): CalculatorResults {
  // Map to core inputs
  const coreInputs = mapToCore(inputs);

  // Call unified core engine
  const coreResults = calculateCore(coreInputs);

  // Map back to legacy format
  return mapFromCore(coreResults, inputs);
}
