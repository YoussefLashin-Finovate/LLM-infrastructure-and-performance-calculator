import { ReverseCalculatorInputs, ReverseCalculatorResults, TokenComputeCosts, KVCacheState, VRAMAllocation, BatchingStrategy } from '../types';
import { getModelArchitecture, getActiveParameters } from '../modelArchitectures';
import * as Eq from '../equations';
import { quantEfficiency, calculateModelSize, calculateKVBytesPerToken, calculateVRAMSafetyBuffer, calculatePrefillFlopsPerToken, calculateDecodeFlopsPerToken } from '../calculationParameters';
import { calculateCpuSizing } from './cpuSizing';
import { calculateBatchingStrategy } from './batching';
import { computeHardwareNeeds } from './compute';
import { calculateTokenAwareResults } from './tokenAware';

export function calculateReverseInfrastructure(inputs: ReverseCalculatorInputs): ReverseCalculatorResults {
  const { 
    modelParams: N, 
    users, 
    inputLength, 
    tokensPerUser, 
    hardwareOpsPerUnit, 
    utilization, 
    quantType,
    tokenBreakdown,
    coldStartRate = 0,
    gpuMemoryGB,
    kvOffloading = false,
    kvOffloadingPercentage = 100,
    useMoeArchitecture = false,
    expertShards = 1,
    useCustomModel = false,
    customTotalParams = 1,
    isCPU = false
  } = inputs;

  if (isCPU) return calculateCpuSizing({ N, hardwareOpsPerUnit, utilization, Q: quantEfficiency[quantType], users, tokensPerUser, inputLength, responseLength: tokensPerUser, thinkTime: 1 });

  const modelName = useCustomModel ? 'custom' : undefined;
  const tokens = tokenBreakdown || { systemPromptTokens: 0, sessionHistoryTokens: 0, newInputTokens: inputLength, outputTokens: tokensPerUser };
  let activeParams: number;
  if (useCustomModel) activeParams = customTotalParams; else { const arch = getModelArchitecture(N, modelName); activeParams = getActiveParameters(N, arch); }
  const Q = quantEfficiency[quantType];
  const totalOutputTokensPerSec = users * tokensPerUser;

  let overheadMultiplier = 1.0;
  const overheadBreakdown: string[] = [];

  const effectiveInputLength = tokenBreakdown ? tokens.newInputTokens : inputLength;
  let prefillOverhead = 0;
  if (effectiveInputLength > 100) {
    prefillOverhead = Math.min(0.3, (effectiveInputLength / 1000) * 0.15);
    overheadBreakdown.push(`+${(prefillOverhead * 100).toFixed(0)}% prefill`);
  }

  const effectiveSequenceLength = tokenBreakdown ? (tokens.newInputTokens + tokens.outputTokens) : (inputLength + (tokensPerUser * 5));
  let attentionOverhead = 0;
  if (effectiveSequenceLength > 2000) {
    attentionOverhead = Math.min(0.4, ((effectiveSequenceLength - 2000) / 10000) * 0.2);
    overheadBreakdown.push(`+${(attentionOverhead * 100).toFixed(0)}% attention`);
  }

  overheadBreakdown.push('+15% redundancy');
  const modelSizeGB = calculateModelSize(N, quantType, modelName, expertShards);

  // Use explicit FLOPS-per-token calculation and additive overheads
  const modelParamsForCalc = useCustomModel ? customTotalParams : N;
  const compute = computeHardwareNeeds({
    modelParamsForCalc,
    tokenBreakdown,
    Q,
    utilization,
    prefillOverhead,
    attentionOverhead,
    redundancyFactor: 1.15,
    totalTokensPerSec: tokenBreakdown ? (tokens.newInputTokens + tokens.outputTokens) : (tokensPerUser * users),
    totalOutputTokensPerSec,
    modelName
  });

  const { hardwareOpsNeeded } = compute;

  // determine GPU count and VRAM constraints (simplified)
  let unitsNeeded: number;
  if (kvOffloading && kvOffloadingPercentage > 0 && gpuMemoryGB && tokenBreakdown) {
    const totalSessionTokens = tokens.systemPromptTokens + tokens.sessionHistoryTokens + tokens.newInputTokens + tokens.outputTokens;
    const kvBytesPerToken = calculateKVBytesPerToken(modelParamsForCalc, quantType, modelName);
    const totalKVCacheGB = Eq.calculateTotalKVCache(totalSessionTokens, kvBytesPerToken, users);
    const kvSplit = Eq.splitKVCache(totalKVCacheGB, kvOffloadingPercentage);
    const safetyBufferGB = calculateVRAMSafetyBuffer(gpuMemoryGB);
    const gpuReq = Eq.calculateOptimalGPUs(hardwareOpsNeeded, hardwareOpsPerUnit, modelSizeGB, kvSplit.inVRAM, gpuMemoryGB, safetyBufferGB, Eq.ATTENTION_BUFFER_GB);
    unitsNeeded = gpuReq.optimalGPUs;
  } else {
    unitsNeeded = Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit);
  }

  if (!unitsNeeded || isNaN(unitsNeeded) || unitsNeeded < 1) unitsNeeded = Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit);

  const theoreticalPerUnit = (hardwareOpsPerUnit / (6 * N * 1e9)) * utilization * Q;
  const throughputPerUnit = theoreticalPerUnit / overheadMultiplier;
  const totalSystemThroughput = throughputPerUnit * unitsNeeded;
  const headroom = ((totalSystemThroughput - totalOutputTokensPerSec) / totalOutputTokensPerSec * 100);
  const totalOverheadPercent = ((overheadMultiplier - 1) * 100);

  let tokenCosts: TokenComputeCosts | undefined;
  let kvCache: KVCacheState | undefined;
  let vramAllocation: VRAMAllocation | undefined;
  let batchingStrategy: BatchingStrategy | undefined;

  if (tokenBreakdown && gpuMemoryGB) {
    const tokenAware = calculateTokenAwareResults({
      tokenBreakdown: tokens,
      gpuMemoryGB,
      users,
      coldStartRate,
      quantType,
      modelName,
      modelParamsForCalc,
      hardwareOpsNeeded,
      hardwareOpsPerUnit,
      unitsNeededInitial: unitsNeeded,
      kvOffloading,
      kvOffloadingPercentage,
      expertShards
    });

    tokenCosts = tokenAware.tokenCosts;
    kvCache = tokenAware.kvCache;
    vramAllocation = tokenAware.vramAllocation;
    batchingStrategy = tokenAware.batchingStrategy;
    unitsNeeded = tokenAware.unitsNeeded;
  }

  return {
    unitsNeeded,
    throughputPerUnit,
    totalSystemThroughput,
    headroom,
    totalOverheadPercent,
    overheadBreakdown,
    tokenCosts,
    kvCache,
    vramAllocation,
    batchingStrategy
  };
}
