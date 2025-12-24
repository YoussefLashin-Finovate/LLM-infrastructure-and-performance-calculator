import { LLAMA_ARCHITECTURES } from './llama';
import { MOE_ARCHITECTURES } from './moe';
import { ModelArchitecture } from './types';

export function getModelArchitecture(
  parametersBillions: number,
  modelName?: string
): ModelArchitecture {
  // Handle custom model - use reasonable defaults based on parameter size
  if (modelName === 'custom') {
    const rounded = Math.round(parametersBillions);
    // Use the closest known architecture or create a reasonable default
    if (LLAMA_ARCHITECTURES[rounded]) {
      return LLAMA_ARCHITECTURES[rounded];
    }
    // Interpolate or use a reasonable default (Llama 70B scaled)
    return {
      layers: Math.max(32, Math.round(80 * parametersBillions / 70)),
      hiddenSize: 8192,
      kvHeads: 8,
      queryHeads: 64,
      intermediateSize: 28672,
      isMoE: false
    };
  }
  
  // Check for MoE model by name first
  if (modelName && MOE_ARCHITECTURES[modelName.toLowerCase()]) {
    return MOE_ARCHITECTURES[modelName.toLowerCase()];
  }
  
  // Round to nearest integer for lookup
  const rounded = Math.round(parametersBillions);
  
  // Direct match
  if (LLAMA_ARCHITECTURES[rounded]) {
    return LLAMA_ARCHITECTURES[rounded];
  }
  
  // Get sorted list of available sizes
  const sizes = Object.keys(LLAMA_ARCHITECTURES)
    .map(Number)
    .sort((a, b) => a - b);
  
  // Below smallest model - use smallest
  if (parametersBillions < sizes[0]) {
    return LLAMA_ARCHITECTURES[sizes[0]];
  }
  
  // Above largest model - use largest
  if (parametersBillions > sizes[sizes.length - 1]) {
    return LLAMA_ARCHITECTURES[sizes[sizes.length - 1]];
  }
  
  // Find bracketing sizes for interpolation
  let lowerSize = sizes[0];
  let upperSize = sizes[sizes.length - 1];
  
  for (let i = 0; i < sizes.length - 1; i++) {
    if (parametersBillions >= sizes[i] && parametersBillions <= sizes[i + 1]) {
      lowerSize = sizes[i];
      upperSize = sizes[i + 1];
      break;
    }
  }
  
  // Linear interpolation
  const lowerArch = LLAMA_ARCHITECTURES[lowerSize];
  const upperArch = LLAMA_ARCHITECTURES[upperSize];
  const ratio = (parametersBillions - lowerSize) / (upperSize - lowerSize);
  
  return {
    layers: Math.round(lowerArch.layers + (upperArch.layers - lowerArch.layers) * ratio),
    hiddenSize: Math.round(lowerArch.hiddenSize + (upperArch.hiddenSize - lowerArch.hiddenSize) * ratio),
    kvHeads: Math.round(lowerArch.kvHeads + (upperArch.kvHeads - lowerArch.kvHeads) * ratio),
    queryHeads: Math.round(lowerArch.queryHeads + (upperArch.queryHeads - lowerArch.queryHeads) * ratio),
    intermediateSize: lowerArch.intermediateSize && upperArch.intermediateSize
      ? Math.round(lowerArch.intermediateSize + (upperArch.intermediateSize - lowerArch.intermediateSize) * ratio)
      : undefined,
  };
}
