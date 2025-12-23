import { useMemo } from 'react';
import { calculatePerformance } from '@/lib/calculations';
import { parseHardwareOpsFromValue } from '@/lib/equations/hardware';
import { hardwareDatabase } from '@/lib/hardwareDatabase';
import { CalculatorResults } from '@/lib/types';

interface UsePerformanceCalculationProps {
  model: string;
  hardware: string;
  utilization: number;
  inputLength: number;
  responseLength: number;
  thinkTime: number;
  useKVCache?: boolean;
  systemPromptTokens?: number;
  sessionHistoryTokens?: number;
  newInputTokens?: number;
  kvOffloading?: boolean;
  useMoeArchitecture?: boolean;
  useCustomModel?: boolean;
  customTotalParams?: number;
  customActiveParams?: number;
  customTotalExperts?: number;
  customActiveExperts?: number;
  units?: number;
  avgResponseTokensPerRequest?: number;
  tokensPerSecPerUser?: number;
  // Device / efficiency controls
  isCPU?: boolean;
  kernelEfficiency?: number;
  cpuAMXEfficiency?: number;
  cpuUtilizationTarget?: number;
  // Capacity/performance controls
  redundancyFactor?: number;
  targetHeadroom?: number;
  offloadRatio?: number;
  activeKvFraction?: number;
  // Production-grade flags & GPU controls
  useProductionFramework?: boolean;
  utilizationFactor?: number;
  attentionOverhead?: number;
  prefillOverhead?: number;
  // CPU-specific production toggles
  cpuPrefillMultiplier?: number;
  cpuRedundancy?: number;
  cpuModelRamOverhead?: number;
}

export function usePerformanceCalculation({
  model,
  hardware,
  utilization,
  inputLength,
  responseLength,
  thinkTime,
  useKVCache = false,
  systemPromptTokens = 0,
  sessionHistoryTokens = 0,
  newInputTokens = 0,
  kvOffloading = false,
  useMoeArchitecture = false,
  useCustomModel = false,
  customTotalParams = 1,
  customActiveParams = 1,
  customTotalExperts = 8,
  customActiveExperts = 2,
  units = 1,
  avgResponseTokensPerRequest = undefined,
  tokensPerSecPerUser = undefined,
  isCPU = false,
  kernelEfficiency = 0.5,
  cpuAMXEfficiency = 0.5,
  cpuUtilizationTarget = 1,
  // Capacity defaults
  redundancyFactor = 0.15,
  targetHeadroom = 0.1,
  offloadRatio = 0,
  activeKvFraction = 0.05,
  // Production defaults
  useProductionFramework = false,
  utilizationFactor = 0.8,
  attentionOverhead = 0.1,
  prefillOverhead = 0.1,
  // CPU production defaults
  cpuPrefillMultiplier = 0.5,
  cpuRedundancy = 0.1,
  cpuModelRamOverhead = 0.2,
}: UsePerformanceCalculationProps): CalculatorResults {
  return useMemo(() => {
    const hardwareOps = parseHardwareOpsFromValue(hardware);

    // Quantization type (if encoded in hardware value) — e.g. 'h100-3958,int8'
    const quantTypeRaw = (hardware.split(',')[1] || '') as string;
    const quantType = (quantTypeRaw === 'fp16' || quantTypeRaw === 'int8' || quantTypeRaw === 'int4') ? (quantTypeRaw as 'fp16' | 'int8' | 'int4') : 'fp16';
    // Note: TOPS/Tera-scaling is already handled above based on suffix or implied T

    
    // Build token breakdown if KV cache is enabled
    const tokenBreakdown = useKVCache ? {
      systemPromptTokens,
      sessionHistoryTokens,
      newInputTokens,
      outputTokens: responseLength
    } : undefined;
    
    // Use custom model params if custom model is enabled or if model='custom'
    const effectiveModelParams = (useCustomModel || model === 'custom') ? customTotalParams * 1e9 : parseFloat(model) * 1e9; // Convert billions to raw parameter count
    const effectiveUseCustomModel = useCustomModel || model === 'custom';
    
    // Get GPU memory from hardware database for VRAM calculations
    const selectedHardware = hardwareDatabase.find(hw => hw.value === hardware);
    const gpuMemoryGB = selectedHardware?.memory || 96; // Default to 96GB if not found
    
    const results: CalculatorResults = calculatePerformance({
      modelParams: effectiveModelParams,
      hardwareOps,
      utilization,
      inputLength,
      responseLength,
      thinkTime,
      quantType,
      tokenBreakdown,
      gpuMemoryGB,
      useMoeArchitecture,
      useCustomModel: effectiveUseCustomModel,
      customTotalParams,
      customActiveParams,
      customTotalExperts,
      customActiveExperts,
      units,
      avgResponseTokensPerRequest,
      tokensPerSecPerUser,
      isCPU,
      kernelEfficiency,
      cpuAMXEfficiency,
      cpuUtilizationTarget,
      // Capacity controls
      redundancyFactor,
      targetHeadroom,
      offloadRatio,
      activeKvFraction,
      // Production / GPU controls
      useProductionFramework,
      utilizationFactor,
      attentionOverhead,
      prefillOverhead,
      // CPU production overrides
      cpuPrefillMultiplier,
      cpuRedundancy,
      cpuModelRamOverhead
    });

    // Calculate FLOP metrics for centralized access (removed - not needed for PerformanceCalculator)
    // const flopsPerToken = calculateDecodeFlopsPerToken(effectiveModelParams, undefined, undefined, useCustomModel ? 'custom' : undefined);
    // const requiredSystemFlops = flopsPerToken * results.realistic; // Required FLOPs for realistic throughput
    // const availableSystemFlops = hardwareOps * kernelEfficiency * utilization; // Available FLOPs based on hardware, kernel efficiency, and utilization

    return {
      ...results,
      // flopsPerToken,
      // requiredSystemFlops,
      // availableSystemFlops,
      // hardwareFlops: hardwareOps,
    } as CalculatorResults;
  }, [model, hardware, utilization, inputLength, responseLength, thinkTime, useKVCache, systemPromptTokens, sessionHistoryTokens, newInputTokens, kvOffloading, useMoeArchitecture, useCustomModel, customTotalParams, customActiveParams, customTotalExperts, customActiveExperts, units, avgResponseTokensPerRequest, tokensPerSecPerUser, redundancyFactor, targetHeadroom, offloadRatio, activeKvFraction, useProductionFramework, utilizationFactor, attentionOverhead, prefillOverhead, cpuPrefillMultiplier, cpuRedundancy, cpuModelRamOverhead]);
}
