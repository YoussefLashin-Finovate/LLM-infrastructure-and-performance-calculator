import { QuantizationSpec, ModelCategory } from './types';

export const quantSpec: QuantizationSpec = {
  fp16: 1,
  int8: 0.6,
  q4_k_s: 0.4,
  int4: 0.35
};

export const modelCategories: ModelCategory[] = [
  {
    models: ["Phi-3", "Gemma 2"],
    arabicModels: [],
    params: "3.8B-9B",
    vram: [4, 10],
    throughput: [150, 400],
    latency: [80, 200],
    ttft: [25, 60],
    users: [20, 80],
    batch: [8, 16],
    context: [1024, 2048]
  },
  {
    models: ["Mistral 7B", "Llama 3.1 8B", "Qwen 2.5 7B", "Gemma 2 9B", "DeepSeek 7B"],
    arabicModels: [],
    params: "7B-9B",
    vram: [8, 18],
    throughput: [200, 800],
    latency: [120, 250],
    ttft: [35, 85],
    users: [15, 60],
    batch: [4, 12],
    context: [2048, 4096]
  },
  {
    models: ["Jais 13B", "Llama 2 13B", "Llama 3.1 13B", "DeepSeek 14B"],
    arabicModels: ["Jais 13B"],
    params: "13B-14B",
    vram: [16, 28],
    throughput: [150, 600],
    latency: [200, 500],
    ttft: [70, 180],
    users: [8, 30],
    batch: [2, 8],
    context: [2048, 4096]
  },
  {
    models: ["Gemma 2 27B", "Qwen 2.5 32B"],
    arabicModels: [],
    params: "27B-32B",
    vram: [24, 65],
    throughput: [100, 400],
    latency: [400, 1000],
    ttft: [150, 400],
    users: [4, 15],
    batch: [1, 4],
    context: [4096, 8192]
  },
  {
    models: ["CodeLlama 34B"],
    arabicModels: [],
    params: "34B",
    vram: [40, 70],
    throughput: [80, 350],
    latency: [500, 1200],
    ttft: [180, 450],
    users: [6, 18],
    batch: [1, 3],
    context: [4096, 8192]
  },
  {
    models: ["Mixtral 8x7B"],
    arabicModels: [],
    params: "46.7B MoE",
    vram: [90, 120],
    throughput: [150, 500],
    latency: [300, 800],
    ttft: [100, 250],
    users: [8, 35],
    batch: [2, 6],
    context: [8192, 16384]
  },
  {
    models: ["Llama 3.1 70B", "Qwen 2.5 72B"],
    arabicModels: [],
    params: "70B-72B",
    vram: [80, 145],
    throughput: [200, 600],
    latency: [800, 2000],
    ttft: [250, 650],
    users: [25, 70],
    batch: [1, 2],
    context: [8192, 32768]
  }
];

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
