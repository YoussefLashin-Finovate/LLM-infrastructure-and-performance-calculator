import { QuantizationSpec, ModelCategory } from './types';

export const quantSpec: QuantizationSpec = {
  fp16: 1,
  int8: 0.6,
  q4_k_s: 0.4,
  int4: 0.35
};

// modelCategories removed — unused in codebase (PerformanceTable uses a local copy).

export const speedBoosts = {
  fp16: "1.0x",
  int8: "1.4x",
  q4_k_s: "2.0x",
  int4: "2.2x"
};

export const qualityImpact = {
  fp16: "no quality loss (full precision)",
  int8: "minimal quality degradation (~1-2% accuracy loss)",
  q4_k_s: "minimal quality degradation (~2-3% accuracy loss)",
  int4: "moderate quality degradation (~3-5% accuracy loss)"
};
