import { useMemo } from 'react';
import { calculateReverseInfrastructure } from '@/lib/calculations';
import { calculateModelSize } from '@/lib/calculationParameters';
import { hardwareDatabase } from '@/lib/hardwareDatabase';

interface UseCapacityCalculationProps {
  model: string;
  hardware: string;
  quantization: string;
  users: number;
  inputLength: number;
  tokensPerSec: number;
  utilization: number;
}

export function useCapacityCalculation({
  model,
  hardware,
  quantization,
  users,
  inputLength,
  tokensPerSec,
  utilization,
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
    
    const modelParams = parseFloat(model);
    
    const results = calculateReverseInfrastructure({
      modelParams,
      users,
      inputLength,
      tokensPerUser: tokensPerSec,
      hardwareOpsPerUnit,
      utilization,
      quantType,
    });
    
    // Calculate accumulated VRAM and FLOPS
    const selectedHardware = hardwareDatabase.find(hw => hw.value === hardware);
    const vramPerUnit = selectedHardware?.memory || 0;
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
  }, [model, hardware, users, inputLength, tokensPerSec, utilization]);
}
