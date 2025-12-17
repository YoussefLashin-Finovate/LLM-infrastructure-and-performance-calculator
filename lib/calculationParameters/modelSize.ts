import { getModelArchitecture, calculateKVBytesPerTokenWithGQA, getVRAMParameters } from '../modelArchitectures';
import { MODEL_SIZE_OVERHEAD, bytesPerParam } from './constants';

const KV_HIDDEN_DIM_DEFAULT = 4096;

export const calculateModelSize = (
  params: number,
  quant: string,
  modelName?: string,
  expertShards: number = 1
): number => {
  const bytes = bytesPerParam[quant] || 2;
  const architecture = getModelArchitecture(params, modelName);
  const vramParams = getVRAMParameters(params, architecture, expertShards);
  return (vramParams * bytes * MODEL_SIZE_OVERHEAD);
};

export const calculateKVBytesPerToken = (
  hiddenDimOrModelParams: number = KV_HIDDEN_DIM_DEFAULT,
  numLayersOrDtype?: number | string,
  dtypeOrModelName?: string
): number => {
  const isModelBased = typeof numLayersOrDtype === 'string';
  if (isModelBased) {
    const modelParams = hiddenDimOrModelParams;
    const dtype = numLayersOrDtype as string;
    const modelName = dtypeOrModelName;
    const architecture = getModelArchitecture(modelParams, modelName);
    const bytesPerValue = bytesPerParam[dtype] || 2;
    return calculateKVBytesPerTokenWithGQA(architecture, bytesPerValue);
  } else {
    const hiddenDim = hiddenDimOrModelParams;
    const numLayers = numLayersOrDtype as number || 32;
    const dtype = dtypeOrModelName || 'fp16';
    const bytesPerValue = bytesPerParam[dtype] || 2;
    return 2 * numLayers * hiddenDim * bytesPerValue;
  }
};
