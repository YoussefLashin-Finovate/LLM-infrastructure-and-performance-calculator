import { useMemo } from 'react';
import { calculatePerformance } from '@/lib/calculations';

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
}: UsePerformanceCalculationProps) {
  return useMemo(() => {
    // Parse hardware ops (TFLOPS/POPS) - extract the numeric value correctly
    const opsString = hardware.split(',')[0].split('-').pop() || '0';
    let hardwareOps = parseFloat(opsString);
    
    // Convert to FLOPS based on quantization type
    const quantType = hardware.split(',')[1] as 'fp16' | 'int8' | 'int4';
    if (quantType === 'int8' || quantType === 'int4') {
      hardwareOps = hardwareOps * 1e12; // TOPS/POPS to OPS
    } else {
      hardwareOps = hardwareOps * 1e12; // TFLOPS to FLOPS
    }
    
    // Build token breakdown if KV cache is enabled
    const tokenBreakdown = useKVCache ? {
      systemPromptTokens,
      sessionHistoryTokens,
      newInputTokens,
      outputTokens: responseLength
    } : undefined;
    
    // Use custom model params if custom model is enabled or if model='custom'
    const effectiveModelParams = (useCustomModel || model === 'custom') ? customTotalParams : parseFloat(model);
    const effectiveUseCustomModel = useCustomModel || model === 'custom';
    
    return calculatePerformance({
      modelParams: effectiveModelParams,
      hardwareOps,
      utilization,
      inputLength,
      responseLength,
      thinkTime,
      quantType,
      tokenBreakdown,
      useMoeArchitecture,
      useCustomModel: effectiveUseCustomModel,
      customTotalParams,
      customActiveParams,
      customTotalExperts,
      customActiveExperts,
    });
  }, [model, hardware, utilization, inputLength, responseLength, thinkTime, useKVCache, systemPromptTokens, sessionHistoryTokens, newInputTokens, kvOffloading, useMoeArchitecture, useCustomModel, customTotalParams, customActiveParams, customTotalExperts, customActiveExperts]);
}
