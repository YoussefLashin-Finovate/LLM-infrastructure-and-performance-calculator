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
    // Parse hardware ops (supports suffixes K/M/G/T/P). If no suffix given we assume T (tera) units
    const opsRaw = (hardware.split(',')[0].split('-').pop() || '0').toString().trim();
    // Match number with optional suffix (K, M, G, T, P) - case-insensitive
    const match = opsRaw.toUpperCase().match(/^([0-9]*\.?[0-9]+)\s*([KMGTP])?$/);
    let hardwareOps = 0;
    if (match) {
      const val = parseFloat(match[1]);
      const suffix = match[2] || 'T'; // default to T (tera) when unspecified
      const scaleMap: { [key: string]: number } = {
        K: 1e3,
        M: 1e6,
        G: 1e9,
        T: 1e12,
        P: 1e15,
      };
      hardwareOps = val * (scaleMap[suffix] || 1e12);
    } else {
      // Fallback: treat as tera (T)
      hardwareOps = parseFloat(opsRaw) * 1e12;
    }

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
