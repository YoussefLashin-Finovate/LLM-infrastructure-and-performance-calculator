export interface KVCacheSplit {
  totalGB: number;
  inVRAM: number;
  offloaded: number;
  percentage: number;
}

export function splitKVCache(totalKVCacheGB: number, offloadingPercentage: number): KVCacheSplit {
  const ratio = offloadingPercentage / 100;
  return {
    totalGB: totalKVCacheGB,
    inVRAM: totalKVCacheGB * (1 - ratio),
    offloaded: totalKVCacheGB * ratio,
    percentage: offloadingPercentage
  };
}

export function calculateTotalKVCache(tokensPerSession: number, bytesPerToken: number, numSessions: number): number {
  return (tokensPerSession * bytesPerToken * numSessions) / 1e9; // Returns GB
}
