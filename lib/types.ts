export interface ModelCategory {
  models: string[];
  arabicModels: string[];
  params: string;
  vram: [number, number];
  throughput: [number, number];
  latency: [number, number];
  ttft: [number, number];
  users: [number, number];
  batch: [number, number];
  context: [number, number];
}

export type QuantizationType = 'fp16' | 'int8' | 'q4_k_s' | 'int4';
export type HardwareType = string; // Hardware values like '3958,int8', '1979,fp16', etc.
export type MetricType = 'throughput' | 'latency' | 'ttft' | 'users' | 'batch' | 'vram' | 'context';

export interface QuantizationSpec {
  [key: string]: number;
}

// Token categorization for accurate compute and memory modeling
export interface TokenBreakdown {
  systemPromptTokens: number;      // Per-session, sent once
  sessionHistoryTokens: number;    // Per-session, grows over time
  newInputTokens: number;          // Per-request, main FLOPS driver
  outputTokens: number;            // Per-request, decode
}

export interface TokenComputeCosts {
  prefillFlopsPerToken: number;
  decodeFlopsPerToken: number;
  kvBytesPerToken: number;
}

export interface KVCacheState {
  totalSessionTokens: number;
  kvMemoryGB: number;
  maxSessionsPerGPU: number;
  kvUtilizationPercent: number;
}

export interface VRAMAllocation {
  modelWeightsGB: number;
  kvCacheGB: number;
  safetyBufferGB: number;
  totalUsedGB: number;
  availableGB: number;
  canFitModel: boolean;
  warnings: string[];
  offloadedMemoryGB?: number; // CPU RAM/NVMe memory used for KV cache offloading
  offloadingPercentage?: number; // Percentage of KV cache offloaded (0-100)
  kvCacheInVRAM?: number; // KV cache kept in GPU VRAM
  kvCacheOffloaded?: number; // KV cache offloaded to CPU/NVMe
}

export interface BatchingStrategy {
  maxBatchSizePerGPU: number;       // Maximum requests that can fit in one batch
  optimalBatchSize: number;          // Recommended batch size for efficiency
  numBatchesPerGPU: number;          // How many batches per GPU
  totalBatches: number;              // Total batches across all GPUs
  requestsPerBatch: number;          // Actual batch size used
  kvCachePerBatch: number;           // KV cache memory per batch (GB)
  latencyMs: number;                 // Expected batch processing latency
  throughputPerGPU: number;          // Tokens/sec per GPU
  utilizationPercent: number;        // GPU compute utilization
  constraints: {
    vramLimited: boolean;
    computeLimited: boolean;
    latencyLimited: boolean;
  };
  recommendations: string[];
}

export interface CalculatorInputs {
  modelParams: number;
  hardwareOps: number;
  utilization: number;
  inputLength: number;
  responseLength: number;
  thinkTime: number;
  quantType: 'fp16' | 'int8' | 'int4';
  // Optional token-aware fields
  tokenBreakdown?: TokenBreakdown;
  coldStartRate?: number;
  gpuMemoryGB?: number;
  // MoE-specific fields
  useMoeArchitecture?: boolean;
  expertShards?: number;
  // Custom model configuration
  useCustomModel?: boolean;
  customTotalParams?: number;
  customActiveParams?: number;
  customTotalExperts?: number;
  customActiveExperts?: number;
}

export interface CalculatorResults {
  theoretical: number;
  realistic: number;
  users: number;
  tokensPerSecPerUser: number;
  words: number;
  isMemoryBound: boolean;
  prefillOverhead: number;
  attentionOverhead: number;
  // Optional token-aware results
  tokenCosts?: TokenComputeCosts;
  kvCache?: KVCacheState;
  vramAllocation?: VRAMAllocation;
  prefillThroughput?: number;
  decodeThroughput?: number;
}

export interface ReverseCalculatorInputs {
  modelParams: number;
  users: number;
  inputLength: number;
  tokensPerUser: number;
  hardwareOpsPerUnit: number;
  utilization: number;
  quantType: 'fp16' | 'int8' | 'int4';
  // Optional token-aware fields
  tokenBreakdown?: TokenBreakdown;
  coldStartRate?: number;
  gpuMemoryGB?: number;
  kvOffloading?: boolean;
  kvOffloadingPercentage?: number; // 0-100: percentage of KV cache to offload to CPU/NVMe
  // MoE-specific fields
  useMoeArchitecture?: boolean;
  expertShards?: number;
  // Custom model configuration
  useCustomModel?: boolean;
  customTotalParams?: number;
  customActiveParams?: number;
  customTotalExperts?: number;
  customActiveExperts?: number;
}

export interface ReverseCalculatorResults {
  unitsNeeded: number;
  throughputPerUnit: number;
  totalSystemThroughput: number;
  headroom: number;
  totalOverheadPercent: number;
  overheadBreakdown: string[];
  // Optional token-aware results
  tokenCosts?: TokenComputeCosts;
  kvCache?: KVCacheState;
  vramAllocation?: VRAMAllocation;
  batchingStrategy?: BatchingStrategy;
}
