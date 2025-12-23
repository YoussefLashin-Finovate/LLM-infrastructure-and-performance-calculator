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
  // Optional performance inputs
  units?: number; // number of hardware units (GPUs/CPUs) available
  kernelEfficiency?: number; // kernel efficiency factor (0..1) - used for GPU calculations
  avgResponseTokensPerRequest?: number; // used to estimate requests/sec for prefill (defaults to responseLength if not provided)
  tokensPerSecPerUser?: number; // input tokens per second per user for performance calculations
  // CPU-specific inputs
  isCPU?: boolean;
  cpuAMXEfficiency?: number; // sustained efficiency for CPU (0..1)
  cpuUtilizationTarget?: number; // utilization target for CPU workloads
  // Capacity/performance controls
  redundancyFactor?: number; // e.g., 0.15 for 15% redundancy
  targetHeadroom?: number; // e.g., 0.10 for 10% headroom
  offloadRatio?: number; // fraction of KV cache offloaded to CPU/NVMe (0..1)
  activeKvFraction?: number; // fraction of users with active KV resident (0..1)
  // Production / GPU and CPU controls
  useProductionFramework?: boolean;
  utilizationFactor?: number;
  attentionOverhead?: number;
  prefillOverhead?: number;
  cpuPrefillMultiplier?: number;
  cpuRedundancy?: number;
  cpuModelRamOverhead?: number;
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
  // Expose capacity control values when present (for UI/debug)
  redundancyFactor?: number;
  targetHeadroom?: number;
  offloadRatio?: number;
  activeKvFraction?: number;
  // New mathematical framework outputs
  usableFlops?: number;
  maxThroughput?: number;
  maxUsers?: number;
  throughputPerGpu?: number;
  usersPerGpu?: number;
  totalOverheadMultiplier?: number;
  effectiveFlopsPerGpu?: number;
  flopsPerToken?: number;
  // New serving efficiency factors
  batchEfficiency?: number;
  prefillEfficiency?: number;
  decodeFlopsPerToken?: number;
  tokenGenerationTime?: number;
  rawMaxUsers?: number;
}

export interface CPUSizingResult {
  modelRamGB: number;
  kvTotalGB?: number;           // Total KV cache required for workload (GB)
  totalMemoryGB?: number;       // model + KV total memory required (GB)
  memoryPerCPU?: number;        // memory required per CPU (GB)
  fitsOnSingleNode?: boolean;
  flopsPerTokenGFLOPS: number;
  totalFlopsTFLOPS: number;
  usableFlopsPerCPU?: number; // in FLOPs/s (same unit as hardwareOpsPerUnit)
  targetTPSPerCPU?: number;
  cpusCompute: number;
  cpusDecode: number;
  M_prefill: number;
  cpusWithPrefill: number;
  U_target: number;
  
  redundancy: number;
  finalCPUs: number;
  finalCPUsRounded: number;
  deliveredTPS: number;
  sanityPass: boolean;
  notes?: string[];
  // Active KV resident size (GB) after applying activeKvFraction
  kvActiveGB?: number;
}

export interface ReverseCalculatorInputs {
  // Production-Grade Framework Inputs
  numUsers?: number;                    // Number of concurrent users
  tokensPerSecPerUser?: number;         // Tokens per second per user
  modelParams: number;                  // Model parameters in billions
  bytesPerParam?: number;               // Bytes per parameter (depends on quantization)
  quantizationLevel?: 'fp16' | 'int8' | 'int4'; // Quantization level
  systemPromptTokens?: number;          // System prompt tokens per session
  sessionHistoryTokens?: number;        // Session history tokens
  newInputTokensPerRequest?: number;    // New input tokens per request
  avgResponseTokensPerRequest?: number; // Average *response/output* tokens per request (used to estimate requests/sec)
  offloadRatio?: number;                // KV cache offload ratio (0-1)
  peakFlops?: number;                   // Peak FLOPs per GPU
  vramPerGpu?: number;                  // VRAM per GPU in GB
  kernelEfficiency?: number;            // Kernel efficiency factor
  utilizationFactor?: number;           // Utilization factor
  attentionOverhead?: number;           // Attention overhead factor
  prefillOverhead?: number;             // Prefill overhead factor
  targetHeadroom?: number;              // Target headroom (e.g., 0.1 for 10%)
  
  // Legacy fields (for backward compatibility) - will be deprecated
  users?: number;
  inputLength?: number;
  tokensPerUser?: number;
  hardwareOpsPerUnit?: number;
  utilization?: number;
  quantType?: 'fp16' | 'int8' | 'int4';
  // Optional token-aware fields
  tokenBreakdown?: TokenBreakdown;
  coldStartRate?: number;
  gpuMemoryGB?: number;
  // Optional CPU memory hint (GB) to validate model placement on single server
  cpuMemoryGB?: number;
  // Optional CPU-specific config overrides
  cpuPrefillMultiplier?: number; // M_prefill
  cpuUtilizationTarget?: number; // U_target
  cpuRedundancy?: number; // redundancy factor
  cpuAMXEfficiency?: number; // AMX sustained efficiency
  cpuModelRamOverhead?: number; // model RAM overhead multiplier
  kvOffloading?: boolean;
  kvOffloadingPercentage?: number; // 0-100: percentage of KV cache to offload to CPU/NVMe
  // Active KV session fraction (0..1). Represents the fraction of users that have their session KV resident at any given time.
  activeKvFraction?: number; // e.g., 0.05 for 5% active sessions
  // MoE-specific fields
  useMoeArchitecture?: boolean;
  expertShards?: number;
  // Custom model configuration
  useCustomModel?: boolean;
  customTotalParams?: number;
  customActiveParams?: number;
  customTotalExperts?: number;
  customActiveExperts?: number;
  // Hardware type
  isCPU?: boolean; // true if CPU-based hardware, false/undefined for GPU
}

export interface ReverseCalculatorResults {
  // Production-Grade Framework Results
  decodeTokensPerSec?: number;          // Decode tokens per second
  decodeFlopsPerSec?: number;           // Decode FLOPs per second
  prefillFlopsPerRequest?: number;      // Prefill FLOPs per request
  prefillFlopsPerSec?: number;          // Prefill FLOPs per second
  requiredFlops?: number;               // Total required FLOPs
  effectiveFlopsPerGpu?: number;        // Effective FLOPs per GPU
  maxUsers?: number;                    // Maximum users this configuration can support
  kvVramPerGpu?: number;                // KV cache VRAM per GPU
  requiredVramPerGpu?: number;          // Required VRAM per GPU
  totalKvCacheGB?: number;              // Total worst-case KV cache (GB)
  effectiveKvCacheGB?: number;          // Effective (active) KV cache resident in-memory (GB)
  gpuCountMemory?: number;              // Memory-limited GPU count
  gpuCountCompute?: number;             // Compute-limited GPU count
  gpuCount?: number;                    // Final GPU count
  
  // Legacy fields (for backward compatibility)
  unitsNeeded: number;
  throughputPerUnit: number;
  totalSystemThroughput: number;
  headroom: number;
  totalOverheadPercent: number;
  overheadBreakdown: string[];
  // Optional CPU-specific sizing results
  cpuSizing?: CPUSizingResult;
  // Optional token-aware results
  tokenCosts?: TokenComputeCosts;
  kvCache?: KVCacheState;
  vramAllocation?: VRAMAllocation;
  batchingStrategy?: BatchingStrategy;
  // FLOPs summary
  requiredFLOPS?: number; // FLOPs/s required for workload (including model overheads)
  availableFLOPS?: number; // FLOPs/s available from selected units (unitsNeeded * hardwareOpsPerUnit)
  // Overhead breakdown separated into model overhead (affects required FLOPs) and capacity overhead (affects hardware counts)
  modelOverheadPercent?: number;
  capacityOverheadPercent?: number;
    // Optional workload breakdown (PFLOPS)
    decodeFlopsPFLOPS?: number;
    prefillFlopsPFLOPS?: number;
    totalWorkloadPFLOPS?: number;
}