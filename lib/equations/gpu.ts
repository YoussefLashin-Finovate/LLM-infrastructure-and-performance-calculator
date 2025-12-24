export interface GPURequirements {
  computeGPUs: number;
  vramGPUs: number;
  optimalGPUs: number;
  isComputeBound: boolean;
  tensorParallelismRequired: boolean;
}

export function calculateOptimalGPUs(
  requiredFLOPS: number,
  flopsPerGPU: number,
  modelSizeGB: number,
  kvCacheInVRAMGB: number,
  vramPerGPU: number,
  safetyBufferGB: number,
  attentionBufferGB: number = 2.0
): GPURequirements {
  const computeGPUs = Math.ceil(requiredFLOPS / flopsPerGPU);
  const totalVRAMNeeded = modelSizeGB + kvCacheInVRAMGB + safetyBufferGB + attentionBufferGB;
  const vramGPUs = Math.ceil(totalVRAMNeeded / vramPerGPU);
  const optimalGPUs = Math.max(computeGPUs, vramGPUs);
  return {
    computeGPUs,
    vramGPUs,
    optimalGPUs,
    isComputeBound: computeGPUs > vramGPUs,
    tensorParallelismRequired: vramGPUs > 1
  };
}
