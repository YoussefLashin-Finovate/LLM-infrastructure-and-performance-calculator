import { useMemo } from 'react';
import { calculatePerformance } from '@/lib/calculations';

interface UsePerformanceCalculationProps {
  model: string;
  hardware: string;
  utilization: number;
  inputLength: number;
  responseLength: number;
  thinkTime: number;
}

export function usePerformanceCalculation({
  model,
  hardware,
  utilization,
  inputLength,
  responseLength,
  thinkTime,
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
    
    return calculatePerformance({
      modelParams: parseFloat(model),
      hardwareOps,
      utilization,
      inputLength,
      responseLength,
      thinkTime,
      quantType,
    });
  }, [model, hardware, utilization, inputLength, responseLength, thinkTime]);
}
