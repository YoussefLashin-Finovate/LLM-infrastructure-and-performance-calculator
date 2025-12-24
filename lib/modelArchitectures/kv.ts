import { ModelArchitecture } from './types';

export function calculateKVBytesPerTokenWithGQA(
  architecture: ModelArchitecture,
  bytesPerValue: number
): number {
  // GQA optimization: only store KV for the KV heads, not all query heads
  const gqaRatio = architecture.kvHeads / architecture.queryHeads;
  
  // 2 for K and V, multiply by layers, hidden size, bytes, and GQA ratio
  const baseKVSize = 2 * architecture.layers * architecture.hiddenSize * bytesPerValue;
  
  return baseKVSize * gqaRatio;
}
