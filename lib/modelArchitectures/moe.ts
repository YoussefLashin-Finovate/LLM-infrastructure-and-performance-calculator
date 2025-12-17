import { ModelArchitecture } from './types';

export const MOE_ARCHITECTURES: Record<string, ModelArchitecture> = {
  // Mixtral 8x7B (56B total parameters, but 13B active per token)
  'mixtral-8x7b': {
    layers: 32,
    hiddenSize: 4096,
    kvHeads: 8,
    queryHeads: 32,
    intermediateSize: 14336,
    isMoE: true,
    totalExperts: 8,
    activeExperts: 2,
    expertParallelism: false,
  },
  // Mixtral 8x22B (176B total parameters, but 44B active per token)
  'mixtral-8x22b': {
    layers: 56,
    hiddenSize: 6144,
    kvHeads: 8,
    queryHeads: 48,
    intermediateSize: 16384,
    isMoE: true,
    totalExperts: 8,
    activeExperts: 2,
    expertParallelism: false,
  },
  // DeepSeek-V2 (236B total, 21B active)
  'deepseek-v2': {
    layers: 60,
    hiddenSize: 5120,
    kvHeads: 16,
    queryHeads: 128,
    intermediateSize: 12288,
    isMoE: true,
    totalExperts: 160,
    activeExperts: 6,
    expertParallelism: false,
  },
  // GPT OSS 120B (16 experts, 15B active per token)
  'gpt-oss-120b': {
    layers: 48,
    hiddenSize: 6144,
    kvHeads: 12,
    queryHeads: 48,
    intermediateSize: 16384,
    isMoE: true,
    totalExperts: 16,
    activeExperts: 2,
    expertParallelism: false,
  },
  // Generic MoE - fallback for any model when MoE toggle is enabled
  // Assumes standard 8 expert, 2 active configuration (like Mixtral)
  'generic-moe': {
    layers: 32,
    hiddenSize: 4096,
    kvHeads: 8,
    queryHeads: 32,
    intermediateSize: 14336,
    isMoE: true,
    totalExperts: 8,
    activeExperts: 2,
    expertParallelism: false,
  },
  // Anthropic Claude 3 Family
  'claude-3-opus': {
    layers: 64,
    hiddenSize: 12288,
    kvHeads: 16,
    queryHeads: 96,
    intermediateSize: 49152,
    isMoE: false,
  },
  'claude-3-sonnet': {
    layers: 48,
    hiddenSize: 8192,
    kvHeads: 16,
    queryHeads: 64,
    intermediateSize: 32768,
    isMoE: false,
  },
  'claude-3-haiku': {
    layers: 32,
    hiddenSize: 5120,
    kvHeads: 8,
    queryHeads: 40,
    intermediateSize: 20480,
    isMoE: false,
  },
  // Anthropic Claude 3.5 Family (Enhanced versions)
  'claude-3.5-sonnet': {
    layers: 52,
    hiddenSize: 8704,
    kvHeads: 16,
    queryHeads: 68,
    intermediateSize: 34816,
    isMoE: false,
  },
  // Anthropic Claude 4 Family (Latest generation)
  'claude-4-opus': {
    layers: 72,
    hiddenSize: 14336,
    kvHeads: 24,
    queryHeads: 112,
    intermediateSize: 57344,
    isMoE: false,
  },
  'claude-4-sonnet': {
    layers: 56,
    hiddenSize: 9216,
    kvHeads: 18,
    queryHeads: 72,
    intermediateSize: 36864,
    isMoE: false,
  },
  'claude-4-haiku': {
    layers: 36,
    hiddenSize: 5632,
    kvHeads: 12,
    queryHeads: 44,
    intermediateSize: 22528,
    isMoE: false,
  },
  // Anthropic Claude Haiku 4.5 (Most recent, optimized for speed)
  'claude-haiku-4.5': {
    layers: 40,
    hiddenSize: 6144,
    kvHeads: 16,
    queryHeads: 48,
    intermediateSize: 24576,
    isMoE: false,
  },
};
