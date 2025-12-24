import * as Eq from '../equations';
import { calculateKVBytesPerToken, calculateModelSize, calculateVRAMSafetyBuffer } from '../calculationParameters';
import { calculateBatchingStrategy } from './batching';

export interface TokenAwareArgs {
  tokenBreakdown: any;
  gpuMemoryGB: number;
  users: number;
  coldStartRate: number;
  quantType: string;
  modelName?: string;
  modelParamsForCalc: number;
  hardwareOpsNeeded: number;
  hardwareOpsPerUnit: number;
  unitsNeededInitial: number;
  kvOffloading: boolean;
  kvOffloadingPercentage: number;
  expertShards: number;
}

export function calculateTokenAwareResults(args: TokenAwareArgs) {
  const {
    tokenBreakdown,
    gpuMemoryGB,
    users,
    coldStartRate,
    quantType,
    modelName,
    modelParamsForCalc,
    hardwareOpsNeeded,
    hardwareOpsPerUnit,
    unitsNeededInitial,
    kvOffloading,
    kvOffloadingPercentage,
    expertShards
  } = args;

  const tokens = tokenBreakdown;
  const sessionContextTokens = tokens.systemPromptTokens + tokens.sessionHistoryTokens;
  const totalSessionTokens = sessionContextTokens + tokens.newInputTokens + tokens.outputTokens;

  // FLOPS per token calculations are not needed here (computed elsewhere); keep as zero placeholders
  const prefillFlopsPerToken = 0;
  const decodeFlopsPerToken = 0;

  const prefillFlopsPerRequest = tokens.newInputTokens * 0;
  const decodeFlopsPerRequest = tokens.outputTokens * 0;
  const totalFlopsPerRequest = prefillFlopsPerRequest + decodeFlopsPerRequest;

  const coldStartFlops = sessionContextTokens * 0 * coldStartRate;
  const effectiveFlopsPerRequest = totalFlopsPerRequest + coldStartFlops;

  const kvBytesPerToken = calculateKVBytesPerToken(modelParamsForCalc, quantType, modelName);
  const kvMemoryPerSessionGB = (totalSessionTokens * kvBytesPerToken) / 1e9;

  const modelSizeGB = calculateModelSize(modelParamsForCalc, quantType, modelName, expertShards);
  const safetyBufferGB = calculateVRAMSafetyBuffer(gpuMemoryGB);
  const availableForKV = gpuMemoryGB - modelSizeGB - safetyBufferGB;
  const maxConcurrentSessions = Math.floor(availableForKV / kvMemoryPerSessionGB);

  const tokenCosts = {
    prefillFlopsPerToken: 0,
    decodeFlopsPerToken: 0,
    kvBytesPerToken
  };

  const totalKVCacheGB = kvMemoryPerSessionGB * users;

  let kvSplit: any;
  let offloadingPercentage = 0;
  if (kvOffloading) {
    offloadingPercentage = kvOffloadingPercentage || 100;
    kvSplit = Eq.splitKVCache(totalKVCacheGB, offloadingPercentage);
  } else {
    kvSplit = { totalGB: totalKVCacheGB, inVRAM: totalKVCacheGB, offloaded: 0, percentage: 0 };
  }

  const totalUsedGB = modelSizeGB + kvSplit.inVRAM + safetyBufferGB;
  const availableGB = gpuMemoryGB - totalUsedGB;
  const canFitModel = totalUsedGB <= gpuMemoryGB;
  const warnings: string[] = [];
  if (!canFitModel) warnings.push(`Model requires ${totalUsedGB.toFixed(1)}GB but only ${gpuMemoryGB}GB available`);
  if (!kvOffloading && maxConcurrentSessions < users) warnings.push(`GPU can fit ${maxConcurrentSessions} sessions but ${users} users requested.`);

  const kvUtilizationPercent = kvSplit.inVRAM > 0 ? (gpuMemoryGB > 0 ? (kvSplit.inVRAM / (gpuMemoryGB - modelSizeGB - safetyBufferGB)) * 100 : 0) : 0;

  const kvCache = {
    totalSessionTokens,
    kvMemoryGB: kvMemoryPerSessionGB,
    maxSessionsPerGPU: kvOffloading ? Infinity : maxConcurrentSessions,
    kvUtilizationPercent
  };

  const vramAllocation = {
    modelWeightsGB: modelSizeGB,
    kvCacheGB: kvSplit.inVRAM > 0 ? (kvSplit.inVRAM / users) : 0,
    safetyBufferGB,
    totalUsedGB,
    availableGB,
    canFitModel,
    warnings,
    offloadedMemoryGB: kvSplit.offloaded > 0 ? kvSplit.offloaded : undefined,
    offloadingPercentage: kvOffloading ? offloadingPercentage : undefined,
    kvCacheInVRAM: kvSplit.inVRAM > 0 ? kvSplit.inVRAM : undefined,
    kvCacheOffloaded: kvSplit.offloaded > 0 ? kvSplit.offloaded : undefined
  };

  // batching
  const kvCachePerRequestGB = kvOffloading ? 0 : kvMemoryPerSessionGB;
  const tokensPerRequestCalc = tokens.newInputTokens + tokens.outputTokens;
  const initialGPUEstimate = Math.max(1, Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit));

  const batchingStrategy = calculateBatchingStrategy(
    gpuMemoryGB,
    modelSizeGB,
    kvCachePerRequestGB,
    users,
    tokensPerRequestCalc,
    modelParamsForCalc,
    initialGPUEstimate
  );

  const { finalBatching, realisticUnits } = require('./batchingHelper').computeBatchingForTokenAware(
    gpuMemoryGB,
    modelSizeGB,
    kvCachePerRequestGB,
    users,
    tokensPerRequestCalc,
    modelParamsForCalc,
    initialGPUEstimate,
    hardwareOpsNeeded,
    hardwareOpsPerUnit,
    unitsNeededInitial
  );

  return {
    unitsNeeded: realisticUnits,
    tokenCosts,
    kvCache,
    vramAllocation,
    batchingStrategy: finalBatching
  };
}
