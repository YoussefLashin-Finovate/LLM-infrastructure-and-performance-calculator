// Local VRAM safety tuning constants
const VRAM_SAFETY_BUFFER_PERCENT = 0.10;
const VRAM_MIN_SAFETY_BUFFER_GB = 8;
const VRAM_COLD_START_MULTIPLIER = 1.15;

export const calculateVRAMSafetyBuffer = (gpuMemoryGB: number): number => {
  const percentBased = gpuMemoryGB * VRAM_SAFETY_BUFFER_PERCENT;
  return Math.max(percentBased, VRAM_MIN_SAFETY_BUFFER_GB);
};
