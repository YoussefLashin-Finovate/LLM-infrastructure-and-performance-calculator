import { useMemo } from 'react';
import { calculateLlmInfrastructure } from '@/lib/calculations';
import { parseHardwareOpsFromValue } from '@/lib/equations/hardware';
import { normalizeQuantType } from '@/lib/equations/quant';
import { calculateModelSize, isCPUHardware, gpuUtilizationFactor } from '@/lib/calculationParameters';

const CPU_UTILIZATION_DEFAULT = 0.25;
import { hardwareDatabase } from '@/lib/hardwareDatabase';

interface UseCapacityCalculationProps {
  // Production-grade framework
  useProductionFramework?: boolean;
  numUsers?: number;
  tokensPerSecPerUser?: number;
  peakFlops?: number;
  vramPerGpu?: number;
  kernelEfficiency?: number;
  utilizationFactor?: number;
  attentionOverhead?: number;
  prefillOverhead?: number;
  targetHeadroom?: number;
  systemPromptTokensPG?: number;
  sessionHistoryTokensPG?: number;
  newInputTokensPerRequest?: number;
  avgResponseTokensPerRequest?: number;
  offloadRatio?: number;
  
  // Legacy fields
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
  cpuPrefillMultiplier?: number;
  cpuUtilizationTarget?: number;
  cpuRedundancy?: number;
  cpuAMXEfficiency?: number;
  cpuModelRamOverhead?: number;
  // Active KV session fraction (0..1)
  activeKvFraction?: number;
}

export function useCapacityCalculation({
  // Production-grade framework
  useProductionFramework = false,
  numUsers = 100,
  tokensPerSecPerUser = 10,
  peakFlops = 1e15,
  vramPerGpu = 96,
  kernelEfficiency = 0.5,
  utilizationFactor = 0.8,
  attentionOverhead = 0.1,
  prefillOverhead = 0.1,
  targetHeadroom = 0.1,
  systemPromptTokensPG = 0,
  sessionHistoryTokensPG = 0,
  newInputTokensPerRequest = 100,
  avgResponseTokensPerRequest = 50,
  offloadRatio = 0,
  
  // Legacy fields
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
  cpuPrefillMultiplier,
  cpuUtilizationTarget,
  cpuRedundancy,
  cpuAMXEfficiency,
  cpuModelRamOverhead,
  // Active KV session fraction
  activeKvFraction = 0.05,
}: UseCapacityCalculationProps) {
  return useMemo(() => {
    // Parse hardware ops (TFLOPS/POPS) - extract the numeric value correctly
    let hardwareOpsPerUnit = parseHardwareOpsFromValue(hardware);
    
    // Use custom model params if custom model is enabled or if model='custom'
    const effectiveUseCustomModel = useCustomModel || model === 'custom';
    const modelParams = effectiveUseCustomModel ? customTotalParams : parseFloat(model);

    // Normalize quantization type for downstream calculations
    const quantType = normalizeQuantType(quantization as string);
    
    // Build token breakdown later (computed after we know hardware) — will be created when useKVCache=true or automatically for CPU mode
    let tokenBreakdown: { systemPromptTokens: number; sessionHistoryTokens: number; newInputTokens: number; outputTokens: number } | undefined = undefined;
    
    // Get GPU memory from hardware database
    const selectedHardware = hardwareDatabase.find(hw => hw.value === hardware);
    const vramPerUnit = selectedHardware?.memory || 0;
    const isCPU = selectedHardware?.type === 'cpu';

    // Build token breakdown if KV cache is enabled OR if we're in CPU mode (CPUs use system RAM for KV by default)
    tokenBreakdown = (useKVCache || isCPU) ? {
      systemPromptTokens,
      sessionHistoryTokens,
      newInputTokens,
      outputTokens: tokensPerSec
    } : undefined; 
    
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
    
    const results = calculateLlmInfrastructure(
      (useProductionFramework && !isCPU) ? {
        // Production-grade framework inputs
        numUsers,
        tokensPerSecPerUser,
        modelParams,
        quantizationLevel: quantType,
        // Extract peak FLOPs and VRAM from selected hardware
        peakFlops: parseHardwareOpsFromValue(hardware),
        vramPerGpu: (() => {
          const selectedHW = hardwareDatabase.find(h => h.value === hardware);
          return selectedHW ? selectedHW.memory : 96; // Default to 96GB if not found
        })(),
        kernelEfficiency,
        utilizationFactor,
        attentionOverhead,
        prefillOverhead,
        targetHeadroom,
        systemPromptTokens: systemPromptTokensPG,
        sessionHistoryTokens: sessionHistoryTokensPG,
        newInputTokensPerRequest,
        avgResponseTokensPerRequest,
        offloadRatio,
        useCustomModel: effectiveUseCustomModel,
        customTotalParams,
        // Active KV fraction (for effective KV reporting)
        activeKvFraction
      } : {
        // Legacy framework inputs
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
        // Active KV fraction forwarded
        activeKvFraction
      }
    );
    
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
  }, [
    // Production-grade dependencies
    useProductionFramework, numUsers, tokensPerSecPerUser, peakFlops, vramPerGpu, kernelEfficiency, utilizationFactor, attentionOverhead, prefillOverhead, targetHeadroom, systemPromptTokensPG, sessionHistoryTokensPG, newInputTokensPerRequest, avgResponseTokensPerRequest, offloadRatio,
    // Legacy dependencies
    model, hardware, users, inputLength, tokensPerSec, utilization, quantization, useKVCache, systemPromptTokens, sessionHistoryTokens, newInputTokens, kvOffloading, kvOffloadingPercentage, useMoeArchitecture, useCustomModel, customTotalParams, customActiveParams, customTotalExperts, customActiveExperts,
    // CPU overrides
    cpuPrefillMultiplier, cpuUtilizationTarget, cpuRedundancy, cpuAMXEfficiency, cpuModelRamOverhead,
    // Active KV fraction (ensure recalculation when user toggles it)
    activeKvFraction
  ]);
}
