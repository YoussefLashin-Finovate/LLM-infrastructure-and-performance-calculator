export function getOptimalBatchSize(modelParams: number): number {
  if (modelParams >= 65) return 48;
  if (modelParams >= 30) return 32;
  if (modelParams >= 10) return 24;
  return 16;
}

export function calculateMaxBatchSize(availableVRAM: number, memoryPerRequest: number, hardLimit: number = 128): number {
  if (memoryPerRequest <= 0 || availableVRAM <= 0) return hardLimit;
  return Math.min(Math.floor(availableVRAM / memoryPerRequest), hardLimit);
}

export function calculateBatchEfficiency(actualSize: number, optimalSize: number): number {
  return Math.min(1.0, actualSize / optimalSize);
}
