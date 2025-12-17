import { calculateBatchingStrategy } from './batching';

export function computeBatchingForTokenAware(
  gpuMemoryGB: number,
  modelSizeGB: number,
  kvCachePerRequestGB: number,
  users: number,
  tokensPerRequestCalc: number,
  modelParamsForCalc: number,
  initialGPUEstimate: number,
  hardwareOpsNeeded: number,
  hardwareOpsPerUnit: number,
  unitsNeededInitial: number
) {
  const batchingStrategy = calculateBatchingStrategy(
    gpuMemoryGB,
    modelSizeGB,
    kvCachePerRequestGB,
    users,
    tokensPerRequestCalc,
    modelParamsForCalc,
    initialGPUEstimate
  );

  const throughputBasedUnits = Math.ceil((users * (tokensPerRequestCalc - tokensPerRequestCalc + tokensPerRequestCalc)) / Math.max(1, batchingStrategy.throughputPerGPU));
  const realisticUnits = Math.max(throughputBasedUnits, unitsNeededInitial);

  const finalBatching = calculateBatchingStrategy(
    gpuMemoryGB,
    modelSizeGB,
    kvCachePerRequestGB,
    users,
    tokensPerRequestCalc,
    modelParamsForCalc,
    realisticUnits
  );

  return { finalBatching, realisticUnits };
}
