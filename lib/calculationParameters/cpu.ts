// Local CPU tuning constants (kept internal; not exported)
const CPU_UTILIZATION_FACTOR = 0.25;
const CPU_MEMORY_BANDWIDTH = 307; // GB/s

export const isCPUHardware = (hardwareValue: string): boolean => {
  const opsValue = parseFloat(hardwareValue.split(',')[0]);
  return hardwareValue.includes('int8') && opsValue < 5.0;
};

// Not currently used anywhere; keep as internal helper to avoid unused export
const calculateCPUSustainedThroughput = (
  peakTOPS: number,
  modelSizeGB: number,
  utilizationFactor: number = CPU_UTILIZATION_FACTOR
): number => {
  const memoryBoundLimit = CPU_MEMORY_BANDWIDTH / modelSizeGB;
  const computeLimit = peakTOPS * 1e12 * utilizationFactor;
  return Math.min(computeLimit, memoryBoundLimit * 1e12) / 1e12;
};
