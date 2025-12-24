import { ModelArchitecture } from './types';

export const LLAMA_ARCHITECTURES: Record<number, ModelArchitecture> = {
  // Llama 3.1 405B
  405: {
    layers: 126,
    hiddenSize: 16384,
    kvHeads: 8,
    queryHeads: 128,
    intermediateSize: 53248,
  },
  // Llama 3.1 70B
  70: {
    layers: 80,
    hiddenSize: 8192,
    kvHeads: 8,
    queryHeads: 64,
    intermediateSize: 28672,
  },
  // Llama 3.1 8B
  8: {
    layers: 32,
    hiddenSize: 4096,
    kvHeads: 8,
    queryHeads: 32,
    intermediateSize: 14336,
  },
  // Llama 2 13B
  13: {
    layers: 40,
    hiddenSize: 5120,
    kvHeads: 40,
    queryHeads: 40,
    intermediateSize: 13824,
  },
  // Llama 2 7B
  7: {
    layers: 32,
    hiddenSize: 4096,
    kvHeads: 32,
    queryHeads: 32,
    intermediateSize: 11008,
  },
};
