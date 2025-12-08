import { CalculatorInputs, CalculatorResults, ReverseCalculatorInputs, ReverseCalculatorResults } from './types';
import { quantEfficiency, memoryBandwidth, MODEL_SIZE_OVERHEAD, PREFILL_BASE_OVERHEAD, PREFILL_MAX_OVERHEAD, PREFILL_SCALING_FACTOR, ATTENTION_BASE_OVERHEAD, ATTENTION_MAX_OVERHEAD, ATTENTION_THRESHOLD, ATTENTION_SCALING_FACTOR, THEORETICAL_CONSTANT, BILLION, KV_CACHE_CONSTANT_1, KV_CACHE_CONSTANT_2, KV_CACHE_CONSTANT_3, bytesPerParam, REDUNDANCY_FACTOR } from './calculationParameters';

export function calculatePerformance(inputs: CalculatorInputs): CalculatorResults {
  const { modelParams: N, hardwareOps, utilization, inputLength, responseLength, thinkTime, quantType } = inputs;

  const Q = quantEfficiency[quantType];
  
  // Determine hardware type for memory bandwidth
  const bw = memoryBandwidth[quantType].default;
  
  // Model memory footprint (GB)
  const modelSizeGB = N * bytesPerParam[quantType];
  
  // KV cache size per token
  const kvCacheBytesPerToken = KV_CACHE_CONSTANT_1 * (N / KV_CACHE_CONSTANT_2) * (KV_CACHE_CONSTANT_3 * Math.sqrt(N)) * bytesPerParam[quantType];
  
  // Theoretical compute-bound limit
  const theoreticalCompute = hardwareOps / (THEORETICAL_CONSTANT * N * BILLION);
  
  // Memory bandwidth limit
  const sequenceLength = inputLength + responseLength;
  const kvCacheSize = kvCacheBytesPerToken * sequenceLength / 1e9;
  const memoryBoundLimit = bw / (modelSizeGB + kvCacheSize);
  
  // Theoretical is minimum of compute and memory limits
  const theoretical = Math.min(theoreticalCompute, memoryBoundLimit);
  const isMemoryBound = memoryBoundLimit < theoreticalCompute;
  
  // Apply utilization and quantization efficiency
  let realistic = theoretical * utilization * Q;
  
  // Prefill overhead
  let prefillOverhead = 0;
  if (inputLength > 100) {
    prefillOverhead = Math.min(PREFILL_MAX_OVERHEAD, (inputLength / PREFILL_SCALING_FACTOR) * PREFILL_BASE_OVERHEAD);
    realistic = realistic * (1 - prefillOverhead);
  }
  
  // Attention overhead
  let attentionOverhead = 0;
  if (sequenceLength > ATTENTION_THRESHOLD) {
    attentionOverhead = Math.min(ATTENTION_MAX_OVERHEAD, ((sequenceLength - ATTENTION_THRESHOLD) / ATTENTION_SCALING_FACTOR) * ATTENTION_BASE_OVERHEAD);
    realistic = realistic * (1 - attentionOverhead);
  }
  
  const tokensPerSecPerUser = responseLength / thinkTime;
  const users = realistic / tokensPerSecPerUser;
  const words = realistic * 0.75;

  return {
    theoretical,
    realistic,
    users,
    tokensPerSecPerUser,
    words,
    isMemoryBound,
    prefillOverhead,
    attentionOverhead
  };
}

export function calculateReverseInfrastructure(inputs: ReverseCalculatorInputs): ReverseCalculatorResults {
  const { modelParams: N, users, inputLength, tokensPerUser, hardwareOpsPerUnit, utilization, quantType } = inputs;
  
  const Q = quantEfficiency[quantType];
  
  // Required tokens/sec for all users
  const totalOutputTokensPerSec = users * tokensPerUser;
  
  // Calculate overheads
  let overheadMultiplier = 1.0;
  const overheadBreakdown: string[] = [];
  
  // Prefill overhead
  let prefillOverhead = 0;
  if (inputLength > 100) {
    prefillOverhead = Math.min(PREFILL_MAX_OVERHEAD, (inputLength / PREFILL_SCALING_FACTOR) * PREFILL_BASE_OVERHEAD);
    overheadMultiplier *= (1 + prefillOverhead);
    overheadBreakdown.push(`+${(prefillOverhead * 100).toFixed(0)}% prefill`);
  }
  
  // Attention overhead
  const sequenceLength = inputLength + (tokensPerUser * 5);
  let attentionOverhead = 0;
  if (sequenceLength > ATTENTION_THRESHOLD) {
    attentionOverhead = Math.min(ATTENTION_MAX_OVERHEAD, ((sequenceLength - ATTENTION_THRESHOLD) / ATTENTION_SCALING_FACTOR) * ATTENTION_BASE_OVERHEAD);
    overheadMultiplier *= (1 + attentionOverhead);
    overheadBreakdown.push(`+${(attentionOverhead * 100).toFixed(0)}% attention`);
  }
  
  // Redundancy factor
  const redundancyFactor = REDUNDANCY_FACTOR;
  overheadMultiplier *= redundancyFactor;
  overheadBreakdown.push('+15% redundancy');
  
  const effectiveTokensPerSec = totalOutputTokensPerSec * overheadMultiplier;
  
  // Calculate hardware needed
  const hardwareOpsNeeded = (effectiveTokensPerSec * 6 * N * 1e9) / (utilization * Q);
  const unitsNeeded = Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit);
  
  // Calculate actual throughput
  const theoreticalPerUnit = (hardwareOpsPerUnit / (6 * N * 1e9)) * utilization * Q;
  const throughputPerUnit = theoreticalPerUnit / overheadMultiplier;
  const totalSystemThroughput = throughputPerUnit * unitsNeeded;
  const headroom = ((totalSystemThroughput - totalOutputTokensPerSec) / totalOutputTokensPerSec * 100);
  const totalOverheadPercent = ((overheadMultiplier - 1) * 100);

  return {
    unitsNeeded,
    throughputPerUnit,
    totalSystemThroughput,
    headroom,
    totalOverheadPercent,
    overheadBreakdown
  };
}

export function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals);
}

export function formatNumberWithCommas(num: number): string {
  return Math.round(num).toLocaleString();
}
