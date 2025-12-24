/**
 * LLM Infrastructure / Capacity Planner
 * 
 * Calculates: Given N users → How many GPUs are required?
 * 
 * This is a thin wrapper around the unified core engine.
 * All actual calculations happen in lib/core/core.ts to ensure
 * mathematical alignment with the Performance Calculator.
 */

import { ReverseCalculatorInputs, ReverseCalculatorResults } from '../types';
import { calculateCore, type CoreInputs } from '../core';
import { EFFICIENCY, SERVING, CAPACITY } from '../core/constants';
import { normalizeQuantType } from '../core/equations';
import { calculateCpuSizing } from './cpuSizing';
import { quantEfficiency } from '../calculationParameters';

/**
 * Main entry point for LLM infrastructure calculations
 */
export function calculateLlmInfrastructure(inputs: ReverseCalculatorInputs): ReverseCalculatorResults {
  // Check if this is a CPU calculation
  if (inputs.isCPU) {
    return handleCpuCalculation(inputs);
  }

  // Check if using production framework (recommended path)
  const useProductionFramework = inputs.numUsers !== undefined && inputs.tokensPerSecPerUser !== undefined;

  if (useProductionFramework) {
    return calculateProductionGradeInfrastructure(inputs);
  }

  // Legacy path - still uses core engine but with legacy input mapping
  return calculateLegacyInfrastructure(inputs);
}

/**
 * Handle CPU-specific sizing
 */
function handleCpuCalculation(inputs: ReverseCalculatorInputs): ReverseCalculatorResults {
  const {
    modelParams: N = 7,
    hardwareOpsPerUnit = 1e15,
    utilization = 0.8,
    quantType = 'int8',
    users = 100,
    tokensPerUser = 10,
    inputLength = 100,
    tokenBreakdown,
    cpuPrefillMultiplier,
    cpuUtilizationTarget,
    cpuRedundancy,
    cpuAMXEfficiency,
    cpuModelRamOverhead,
    activeKvFraction = 0.05,
  } = inputs;

  // calculateCpuSizing already returns ReverseCalculatorResults
  return calculateCpuSizing({
    N,
    hardwareOpsPerUnit,
    utilization,
    Q: quantEfficiency[quantType] || 0.88,
    users,
    tokensPerUser,
    inputLength,
    responseLength: tokensPerUser,
    thinkTime: 1,
    cpuPrefillMultiplier,
    cpuUtilizationTarget,
    cpuRedundancy,
    cpuAMXEfficiency,
    cpuModelRamOverhead,
    tokenBreakdown,
    quantType,
    activeKvFraction,
  });
}

/**
 * Production-grade infrastructure calculation using unified core engine
 */
function calculateProductionGradeInfrastructure(inputs: ReverseCalculatorInputs): ReverseCalculatorResults {
  const {
    numUsers = 100,
    tokensPerSecPerUser = SERVING.DEFAULT_TOKENS_PER_SEC_PER_USER,
    modelParams = 7,
    quantizationLevel = 'int8',
    peakFlops = 1e15,
    vramPerGpu = 96,
    kernelEfficiency = EFFICIENCY.DEFAULT_KERNEL_EFFICIENCY,
    utilizationFactor = EFFICIENCY.DEFAULT_UTILIZATION_FACTOR,
    attentionOverhead = 0.1,
    prefillOverhead = 0.1,
    targetHeadroom = CAPACITY.DEFAULT_HEADROOM,
    systemPromptTokens = 0,
    sessionHistoryTokens = 0,
    newInputTokensPerRequest = SERVING.DEFAULT_INPUT_TOKENS,
    avgResponseTokensPerRequest = SERVING.DEFAULT_AVG_RESPONSE_TOKENS,
    offloadRatio = 0,
    useCustomModel = false,
    customTotalParams = 1,
    activeKvFraction = 1.0,
  } = inputs;

  // Map to core inputs
  const coreInputs: CoreInputs = {
    modelParams: useCustomModel ? customTotalParams : modelParams,
    quantType: normalizeQuantType(quantizationLevel),
    modelName: useCustomModel ? 'custom' : undefined,
    useCustomModel,
    peakFlops,
    vramPerUnit: vramPerGpu,
    device: 'gpu',
    kernelEfficiency,
    utilizationFactor,
    attentionOverhead,
    prefillOverhead,
    tokensPerSecPerUser,
    avgResponseTokensPerRequest,
    newInputTokensPerRequest,
    systemPromptTokens,
    sessionHistoryTokens,
    activeKvFraction,
    offloadRatio,
    targetHeadroom,
    numUsers, // Capacity mode: specify users to calculate GPUs
  };

  // Call unified core engine
  const coreResults = calculateCore(coreInputs);

  // Calculate additional values for display
  const decodeTokensPerSec = numUsers * tokensPerSecPerUser;
  const requestsPerSecPerUser = avgResponseTokensPerRequest > 0
    ? tokensPerSecPerUser / avgResponseTokensPerRequest
    : 0;
  const prefillFlopsPerRequest = newInputTokensPerRequest * coreResults.prefillFlopsPerToken;

  // PFLOPS breakdown
  const decodeFlopsPFLOPS = coreResults.decodeFlopsPerSec / 1e15;
  const prefillFlopsPFLOPS = coreResults.prefillFlopsPerSec / 1e15;
  const totalWorkloadPFLOPS = (coreResults.decodeFlopsPerSec + coreResults.prefillFlopsPerSec) / 1e15;

  return {
    // Production-grade results
    decodeTokensPerSec,
    decodeFlopsPerSec: coreResults.decodeFlopsPerSec,
    prefillFlopsPerRequest,
    prefillFlopsPerSec: coreResults.prefillFlopsPerSec,
    effectiveFlopsPerGpu: coreResults.effectiveFlopsPerUnit,
    maxUsers: coreResults.maxUsers,
    kvVramPerGpu: coreResults.kvCacheInVramPerUnitGB,
    totalKvCacheGB: coreResults.totalKvCacheGB,
    effectiveKvCacheGB: coreResults.totalKvCacheGB * activeKvFraction,
    requiredVramPerGpu: coreResults.requiredVramPerUnit,
    gpuCountMemory: coreResults.unitsForMemory,
    gpuCountCompute: coreResults.unitsForCompute,
    gpuCount: coreResults.units,

    // Legacy compatibility
    unitsNeeded: coreResults.units,
    throughputPerUnit: coreResults.effectiveFlopsPerUnit / coreResults.decodeFlopsPerToken,
    totalSystemThroughput: coreResults.systemTokensPerSec,
    headroom: coreResults.headroomPercent,
    modelOverheadPercent: coreResults.attentionOverheadPercent + coreResults.prefillOverheadPercent,
    capacityOverheadPercent: coreResults.headroomPercent,
    overheadBreakdown: [
      `Model Overheads - Attention: ${coreResults.attentionOverheadPercent.toFixed(1)}%, Prefill: ${coreResults.prefillOverheadPercent.toFixed(1)}%`,
      `Capacity Overheads - Headroom: ${coreResults.headroomPercent.toFixed(1)}%`
    ],
    totalOverheadPercent: coreResults.attentionOverheadPercent + coreResults.prefillOverheadPercent + coreResults.headroomPercent,
    requiredFLOPS: coreResults.requiredFlops,
    requiredFlops: coreResults.requiredFlops,
    decodeFlopsPFLOPS,
    prefillFlopsPFLOPS,
    totalWorkloadPFLOPS,
    availableFLOPS: coreResults.totalSystemFlops,
  };
}

/**
 * Legacy infrastructure calculation
 * 
 * This path is deprecated but maintained for backward compatibility.
 * It maps legacy inputs to core inputs and calls the unified engine.
 */
function calculateLegacyInfrastructure(inputs: ReverseCalculatorInputs): ReverseCalculatorResults {
  const {
    modelParams: N = 7,
    users = 100,
    inputLength = 100,
    tokensPerUser = 10,
    hardwareOpsPerUnit = 1e15,
    utilization = 0.8,
    quantType = 'int8',
    tokenBreakdown,
    gpuMemoryGB,
    kvOffloading = false,
    kvOffloadingPercentage = 100,
    useCustomModel = false,
    customTotalParams = 1,
  } = inputs;

  // Map legacy inputs to core inputs
  const coreInputs: CoreInputs = {
    modelParams: useCustomModel ? customTotalParams : N,
    quantType: normalizeQuantType(quantType),
    modelName: useCustomModel ? 'custom' : undefined,
    useCustomModel,
    peakFlops: hardwareOpsPerUnit,
    vramPerUnit: gpuMemoryGB || 96,
    device: 'gpu',
    kernelEfficiency: EFFICIENCY.DEFAULT_KERNEL_EFFICIENCY,
    utilizationFactor: utilization,
    attentionOverhead: 0.1, // Default legacy overhead
    prefillOverhead: 0.1,   // Default legacy overhead
    tokensPerSecPerUser: tokensPerUser,
    avgResponseTokensPerRequest: tokenBreakdown?.outputTokens || 50,
    newInputTokensPerRequest: tokenBreakdown?.newInputTokens || inputLength,
    systemPromptTokens: tokenBreakdown?.systemPromptTokens || 0,
    sessionHistoryTokens: tokenBreakdown?.sessionHistoryTokens || 0,
    activeKvFraction: 1.0,
    offloadRatio: kvOffloading ? kvOffloadingPercentage / 100 : 0,
    targetHeadroom: CAPACITY.DEFAULT_HEADROOM,
    numUsers: users,
  };

  // Call unified core engine
  const coreResults = calculateCore(coreInputs);

  return {
    unitsNeeded: coreResults.units,
    throughputPerUnit: coreResults.effectiveFlopsPerUnit / coreResults.decodeFlopsPerToken,
    totalSystemThroughput: coreResults.systemTokensPerSec,
    headroom: ((coreResults.maxUsers - users) / Math.max(1, users)) * 100,
    totalOverheadPercent: (coreResults.totalOverheadMultiplier - 1) * 100,
    overheadBreakdown: [
      `+${coreResults.prefillOverheadPercent.toFixed(0)}% prefill`,
      `+${coreResults.attentionOverheadPercent.toFixed(0)}% attention`,
    ],
    requiredFLOPS: coreResults.requiredFlops,
    availableFLOPS: coreResults.totalSystemFlops,
  };
}

// Backwards-compatible alias
export const calculateReverseInfrastructure = calculateLlmInfrastructure;