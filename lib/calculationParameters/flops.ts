import { getModelArchitecture, getActiveParameters } from '../modelArchitectures';
import { TOKEN_FLOPS_PREFILL_K, TOKEN_FLOPS_DECODE_K, KERNEL_EFFICIENCY_DEFAULT } from './constants';

// Calculate prefill FLOPS per token (FLOPS units)
export const calculatePrefillFlopsPerToken = (
  modelParams: number,
  kMultiplier: number = TOKEN_FLOPS_PREFILL_K,
  kernelEfficiency: number = KERNEL_EFFICIENCY_DEFAULT,
  modelName?: string
): number => {
  const architecture = getModelArchitecture(modelParams, modelName);
  const activeParams = getActiveParameters(modelParams, architecture);
  return kMultiplier * activeParams * 1e9 * kernelEfficiency;
};

// Calculate decode FLOPS per token (FLOPS units)
export const calculateDecodeFlopsPerToken = (
  modelParams: number,
  kMultiplier: number = TOKEN_FLOPS_DECODE_K,
  kernelEfficiency: number = KERNEL_EFFICIENCY_DEFAULT,
  modelName?: string
): number => {
  return kMultiplier * modelParams * 1e9 * kernelEfficiency;
};
