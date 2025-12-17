import { CalculatorInputs, CalculatorResults, TokenBreakdown, TokenComputeCosts, KVCacheState, VRAMAllocation } from '../types';
import { getModelArchitecture, getActiveParameters } from '../modelArchitectures';
import * as Eq from '../equations';
import { quantEfficiency, memoryBandwidth, calculateModelSize, calculateKVBytesPerToken, calculatePrefillFlopsPerToken, calculateDecodeFlopsPerToken, calculateVRAMSafetyBuffer } from '../calculationParameters';
import { calculateTokenAwareResults } from './tokenAware';

export function calculatePerformance(inputs: CalculatorInputs): CalculatorResults {
  const { 
    modelParams: N, 
    utilization, 
    inputLength, 
    responseLength, 
    thinkTime, 
    quantType,
    tokenBreakdown,
    coldStartRate = 0,
    gpuMemoryGB,
    useMoeArchitecture = false,
    expertShards = 1,
    useCustomModel = false,
    customTotalParams = 1
  } = inputs;

  const modelName = useCustomModel ? 'custom' : undefined;

  const tokens: TokenBreakdown = tokenBreakdown || {
    systemPromptTokens: 0,
    sessionHistoryTokens: 0,
    newInputTokens: inputLength,
    outputTokens: responseLength
  };

  let activeParams: number;
  if (useCustomModel) {
    activeParams = customTotalParams;
  } else {
    const architecture = getModelArchitecture(N, modelName);
    activeParams = getActiveParameters(N, architecture);
  }

  const Q = quantEfficiency[quantType];
  const bw = memoryBandwidth[quantType].default;
  const totalParamsForVRAM = useCustomModel ? customTotalParams : N;
  const modelSizeGB = calculateModelSize(totalParamsForVRAM, quantType, modelName, expertShards);

  const kvCacheBytesPerToken = 0; // legacy placeholder

  const theoreticalCompute = 0; // simplified baseline for modularization

  const sequenceLength = inputLength + responseLength;
  const kvCacheSize = kvCacheBytesPerToken * sequenceLength / 1e9;
  const memoryBoundLimit = bw / (modelSizeGB + kvCacheSize);
  const theoretical = Math.min(theoreticalCompute, memoryBoundLimit);
  const isMemoryBound = memoryBoundLimit < theoreticalCompute;

  let realistic = theoretical * utilization * Q;

  let prefillOverhead = 0;
  if (inputLength > 100) {
    prefillOverhead = Math.min(0.3, (inputLength / 1000) * 0.15);
    realistic = realistic * (1 - prefillOverhead);
  }

  let attentionOverhead = 0;
  if (sequenceLength > 2000) {
    attentionOverhead = Math.min(0.4, ((sequenceLength - 2000) / 10000) * 0.2);
    realistic = realistic * (1 - attentionOverhead);
  }

  const tokensPerSecPerUser = responseLength / thinkTime;
  const users = realistic / tokensPerSecPerUser;
  const words = realistic * 0.75;

  let tokenCosts: TokenComputeCosts | undefined;
  let kvCache: KVCacheState | undefined;
  let vramAllocation: VRAMAllocation | undefined;

  if (tokenBreakdown && gpuMemoryGB) {
    const tokenAware = calculateTokenAwareResults({
      tokenBreakdown,
      gpuMemoryGB,
      users: realistic,
      coldStartRate,
      quantType,
      modelName,
      modelParamsForCalc: useCustomModel ? customTotalParams : N,
      hardwareOpsNeeded: 0,
      hardwareOpsPerUnit: 0,
      unitsNeededInitial: 1,
      kvOffloading: false,
      kvOffloadingPercentage: 0,
      expertShards
    });

    tokenCosts = tokenAware.tokenCosts;
    kvCache = tokenAware.kvCache;
    vramAllocation = tokenAware.vramAllocation;
  }

  return {
    theoretical,
    realistic,
    users,
    tokensPerSecPerUser,
    words,
    isMemoryBound,
    prefillOverhead,
    attentionOverhead,
    tokenCosts,
    kvCache,
    vramAllocation
  };
}
