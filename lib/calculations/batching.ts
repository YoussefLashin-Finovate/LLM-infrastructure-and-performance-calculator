import { BatchingStrategy } from '../types';

export function createFailedBatchingStrategy(totalUsers: number, numGPUs: number, reason: string): BatchingStrategy {
  return {
    maxBatchSizePerGPU: 0,
    optimalBatchSize: 0,
    numBatchesPerGPU: 0,
    totalBatches: 0,
    requestsPerBatch: 0,
    kvCachePerBatch: 0,
    latencyMs: 0,
    throughputPerGPU: 0,
    utilizationPercent: 0,
    constraints: {
      vramLimited: true,
      computeLimited: false,
      latencyLimited: false
    },
    recommendations: [`❌ ${reason}`]
  };
}

export function calculateBatchingStrategy(
  gpuMemoryGB: number,
  modelSizeGB: number,
  kvCachePerRequestGB: number,
  totalUsers: number,
  tokensPerRequest: number,
  modelParams: number,
  numGPUs: number = 1
): BatchingStrategy {
  const ACTIVATION_MEMORY_PER_REQUEST_GB = 0.05;
  const ATTENTION_BUFFER_GB = 2.0;
  const MIN_REALISTIC_BATCH = 8;
  const MAX_REALISTIC_BATCH = 128;
  const OPTIMAL_BATCH_RANGE = [16, 64];

  const safetyBufferGB = Math.max(gpuMemoryGB * 0.10, 8);
  const minGPUsForModel = Math.ceil((modelSizeGB + safetyBufferGB + ATTENTION_BUFFER_GB) / gpuMemoryGB);
  const actualNumGPUs = Math.max(numGPUs, minGPUsForModel);
  const modelSizePerGPU = modelSizeGB / actualNumGPUs;

  const baseMemoryUsed = modelSizePerGPU + safetyBufferGB + ATTENTION_BUFFER_GB;
  const availableForBatching = gpuMemoryGB - baseMemoryUsed;

  if (availableForBatching <= 0) {
    return createFailedBatchingStrategy(totalUsers, actualNumGPUs, `Model requires ${minGPUsForModel} GPUs with tensor parallelism, but still insufficient VRAM.`);
  }

  const memoryPerRequest = kvCachePerRequestGB + ACTIVATION_MEMORY_PER_REQUEST_GB;
  let maxBatchSizeVRAM = memoryPerRequest > 0 ? Math.floor(availableForBatching / memoryPerRequest) : MAX_REALISTIC_BATCH;
  maxBatchSizeVRAM = Math.min(maxBatchSizeVRAM, MAX_REALISTIC_BATCH);

  // heuristic optimal batch by model size
  let optimalBatchSize = 16;
  if (modelParams >= 65) optimalBatchSize = 48;
  else if (modelParams >= 30) optimalBatchSize = 32;
  else if (modelParams >= 10) optimalBatchSize = 24;

  const constrainedOptimalSize = Math.min(optimalBatchSize, maxBatchSizeVRAM, totalUsers);
  const finalOptimalSize = Math.max(constrainedOptimalSize, MIN_REALISTIC_BATCH);
  const requestsPerBatch = Math.min(finalOptimalSize, maxBatchSizeVRAM);

  const totalRequestsPerGPU = Math.ceil(totalUsers / actualNumGPUs);
  const numBatchesPerGPU = Math.ceil(totalRequestsPerGPU / requestsPerBatch);
  const totalBatches = numBatchesPerGPU * actualNumGPUs;

  const kvCachePerBatch = kvCachePerRequestGB * requestsPerBatch;
  const activationsPerBatch = ACTIVATION_MEMORY_PER_REQUEST_GB * requestsPerBatch;
  const totalBatchMemory = kvCachePerBatch + activationsPerBatch;

  const batchEfficiency = Math.min(1.0, requestsPerBatch / optimalBatchSize);

  let baseTokensPerSec: number;
  if (modelParams >= 65) baseTokensPerSec = 1500 + (batchEfficiency * 1500);
  else if (modelParams >= 30) baseTokensPerSec = 3000 + (batchEfficiency * 2000);
  else if (modelParams >= 10) baseTokensPerSec = 5000 + (batchEfficiency * 3000);
  else baseTokensPerSec = 8000 + (batchEfficiency * 7000);

  const throughputPerGPU = baseTokensPerSec;

  const prefillLatencyMs = 50;
  const decodeLatencyMs = 15 * tokensPerRequest;
  const actualLatencyMs = prefillLatencyMs + decodeLatencyMs;

  const memoryUtilization = ((baseMemoryUsed + totalBatchMemory) / gpuMemoryGB) * 100;
  const computeUtilization = Math.min(90, 40 + (batchEfficiency * 50));
  const utilizationPercent = Math.min(memoryUtilization, computeUtilization);

  const vramLimited = maxBatchSizeVRAM < optimalBatchSize;
  const computeLimited = !vramLimited && requestsPerBatch >= optimalBatchSize;

  const recommendations: string[] = [];
  if (minGPUsForModel > 1) recommendations.push(`Model requires tensor parallelism across ${minGPUsForModel} GPUs.`);
  if (vramLimited) recommendations.push(`VRAM-limited: Batch size reduced to ${requestsPerBatch}.`);
  if (requestsPerBatch < MIN_REALISTIC_BATCH) recommendations.push(`Batch size ${requestsPerBatch} is too small for efficient inference.`);
  if (requestsPerBatch >= OPTIMAL_BATCH_RANGE[0] && requestsPerBatch <= OPTIMAL_BATCH_RANGE[1]) recommendations.push(`Batch size ${requestsPerBatch} is in optimal range.`);
  if (computeUtilization < 60) recommendations.push(`GPU underutilized (${computeUtilization.toFixed(0)}%).`);

  return {
    maxBatchSizePerGPU: maxBatchSizeVRAM,
    optimalBatchSize: finalOptimalSize,
    numBatchesPerGPU,
    totalBatches,
    requestsPerBatch,
    kvCachePerBatch: totalBatchMemory,
    latencyMs: actualLatencyMs,
    throughputPerGPU,
    utilizationPercent,
    constraints: { vramLimited, computeLimited, latencyLimited: false },
    recommendations
  };
}
