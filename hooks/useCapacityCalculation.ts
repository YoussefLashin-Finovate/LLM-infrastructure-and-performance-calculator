import { useMemo } from 'react';
import { calculateReverseInfrastructure } from '@/lib/calculations';
import { calculateModelSize, isCPUHardware, gpuUtilizationFactor } from '@/lib/calculationParameters';

const CPU_UTILIZATION_DEFAULT = 0.25;
import { hardwareDatabase } from '@/lib/hardwareDatabase';

interface UseCapacityCalculationProps {
  model: string;
  hardware: string;
  quantization: string;
  users: number;
  inputLength: number;
  tokensPerSec: number;
  utilization: number;
  useKVCache?: boolean;
  systemPromptTokens?: number;
  sessionHistoryTokens?: number;
  newInputTokens?: number;
  kvOffloading?: boolean;
  kvOffloadingPercentage?: number;
  useMoeArchitecture?: boolean;
  useCustomModel?: boolean;
  customTotalParams?: number;
  customActiveParams?: number;
  customTotalExperts?: number;
  customActiveExperts?: number;
  // CPU overrides
  cpuTps?: number;
  cpuPrefillMultiplier?: number;
  cpuUtilizationTarget?: number;
  cpuRedundancy?: number;
  cpuAMXEfficiency?: number;
  cpuModelRamOverhead?: number;
}

export function useCapacityCalculation({
  model,
  hardware,
  quantization,
  users,
  inputLength,
  tokensPerSec,
  utilization,
  useKVCache = false,
  systemPromptTokens = 0,
  sessionHistoryTokens = 0,
  newInputTokens = 0,
  kvOffloading = false,
  kvOffloadingPercentage = 100,
  useMoeArchitecture = false,
  useCustomModel = false,
  customTotalParams = 1,
  customActiveParams = 1,
  customTotalExperts = 8,
  customActiveExperts = 2,
  // CPU-specific overrides
  cpuTps,
  cpuPrefillMultiplier,
  cpuUtilizationTarget,
  cpuRedundancy,
  cpuAMXEfficiency,
  cpuModelRamOverhead,
}: UseCapacityCalculationProps) {
  return useMemo(() => {
    // Parse hardware ops (TFLOPS/POPS) - extract the numeric value correctly
    const opsString = hardware.split(',')[0].split('-').pop() || '0';
    let hardwareOpsPerUnit = parseFloat(opsString);
    
    // Convert to FLOPS based on quantization type
    const quantType = quantization as 'fp16' | 'int8' | 'int4';
    if (quantType === 'int8' || quantType === 'int4') {
      hardwareOpsPerUnit = hardwareOpsPerUnit * 1e12; // TOPS/POPS to OPS
    } else {
      hardwareOpsPerUnit = hardwareOpsPerUnit * 1e12; // TFLOPS to FLOPS
    }
    
    // Use custom model params if custom model is enabled or if model='custom'
    const effectiveUseCustomModel = useCustomModel || model === 'custom';
    const modelParams = effectiveUseCustomModel ? customTotalParams : parseFloat(model);
    
    // Build token breakdown if KV cache is enabled
    const tokenBreakdown = useKVCache ? {
      systemPromptTokens,
      sessionHistoryTokens,
      newInputTokens,
      outputTokens: tokensPerSec
    } : undefined;
    
    // Get GPU memory from hardware database
    const selectedHardware = hardwareDatabase.find(hw => hw.value === hardware);
    const vramPerUnit = selectedHardware?.memory || 0;
    const isCPU = selectedHardware?.type === 'cpu';
    
    // Apply CPU-specific utilization factor if using CPU
    const effectiveUtilization = isCPU ? (cpuUtilizationTarget ?? CPU_UTILIZATION_DEFAULT) : (utilization || gpuUtilizationFactor);
    
    // Disable KV offloading for CPUs (they already use system RAM)
    const effectiveKvOffloading = isCPU ? false : kvOffloading;
    const effectiveKvOffloadingPercentage = isCPU ? 0 : kvOffloadingPercentage;
    
    // Add warning for CPU hardware
    if (isCPU && typeof window !== 'undefined') {
      console.warn('⚠️ CPU-based inference detected. Applying realistic utilization factor:', effectiveUtilization);
      console.warn('💡 CPUs are memory-bound for LLM inference. Consider GPUs for production workloads.');
      if (kvOffloading) {
        console.warn('ℹ️ KV offloading disabled: CPUs already use system RAM for all operations.');
      }
    }
    
    const results = calculateReverseInfrastructure({
      modelParams,
      users,
      inputLength,
      tokensPerUser: tokensPerSec,
      hardwareOpsPerUnit,
      utilization: effectiveUtilization,
      quantType,
      tokenBreakdown,
      gpuMemoryGB: vramPerUnit,
      // Forward CPU overrides when present
      cpuTps,
      cpuPrefillMultiplier,
      cpuUtilizationTarget,
      cpuRedundancy,
      cpuAMXEfficiency,
      cpuModelRamOverhead,
      kvOffloading: effectiveKvOffloading,
      kvOffloadingPercentage: effectiveKvOffloadingPercentage,
      useMoeArchitecture,
      useCustomModel: effectiveUseCustomModel,
      customTotalParams,
      customActiveParams,
      customTotalExperts,
      customActiveExperts,
      isCPU,
      cpuMemoryGB: isCPU ? vramPerUnit : undefined,
    });
    
    // Calculate accumulated VRAM and FLOPS
    const totalVRAM = vramPerUnit * results.unitsNeeded;
    const totalFLOPS = hardwareOpsPerUnit * results.unitsNeeded;
    const modelSize = calculateModelSize(modelParams, quantType);
    
    return {
      ...results,
      totalVRAM,
      totalFLOPS,
      modelSize,
      vramPerUnit,
    };
  }, [model, hardware, users, inputLength, tokensPerSec, utilization, quantization, useKVCache, systemPromptTokens, sessionHistoryTokens, newInputTokens, kvOffloading, kvOffloadingPercentage, useMoeArchitecture, useCustomModel, customTotalParams, customActiveParams, customTotalExperts, customActiveExperts]);
}
