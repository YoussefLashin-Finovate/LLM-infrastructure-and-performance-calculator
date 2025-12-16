/**
 * LLM Infrastructure Calculations
 * 
 * Uses unified equations module for all mathematical operations.
 * See lib/equations.ts for core formulas and constants.
 */

import { CalculatorInputs, CalculatorResults, ReverseCalculatorInputs, ReverseCalculatorResults, TokenBreakdown, TokenComputeCosts, KVCacheState, VRAMAllocation, BatchingStrategy } from './types';
import { 
  quantEfficiency, 
  memoryBandwidth, 
  MODEL_SIZE_OVERHEAD, 
  PREFILL_BASE_OVERHEAD, 
  PREFILL_MAX_OVERHEAD, 
  PREFILL_SCALING_FACTOR, 
  ATTENTION_BASE_OVERHEAD, 
  ATTENTION_MAX_OVERHEAD, 
  ATTENTION_THRESHOLD, 
  ATTENTION_SCALING_FACTOR, 
  THEORETICAL_CONSTANT, 
  BILLION, 
  KV_CACHE_CONSTANT_1, 
  KV_CACHE_CONSTANT_2, 
  KV_CACHE_CONSTANT_3, 
  bytesPerParam, 
  REDUNDANCY_FACTOR,
  TOKEN_FLOPS_PREFILL_K,
  TOKEN_FLOPS_DECODE_K,
  calculateKVBytesPerToken,
  calculatePrefillFlopsPerToken,
  calculateDecodeFlopsPerToken,
  calculateVRAMSafetyBuffer,
  calculateModelSize
} from './calculationParameters';
import { getModelArchitecture, getActiveParameters } from './modelArchitectures';
import * as Eq from './equations';

/**
 * Map parameter count and MoE flag to specific model architecture name
 * This allows the boolean toggle to select the appropriate MoE architecture
 * 
 * For known models, maps to specific architectures.
 * For unknown models, creates a generic MoE configuration.
 */
function getModelNameFromParams(params: number, useMoeArchitecture: boolean): string | undefined {
  if (!useMoeArchitecture) return undefined;
  
  // Map known MoE models based on parameter count
  if (params >= 119 && params <= 121) return 'gpt-oss-120b';
  if (params >= 46 && params <= 47) return 'mixtral-8x7b';
  if (params >= 175 && params <= 177) return 'mixtral-8x22b';
  if (params >= 235 && params <= 237) return 'deepseek-v2';
  
  // For any other model with MoE enabled, return a generic identifier
  // This will trigger default MoE calculations
  return 'generic-moe';
}

export function calculatePerformance(inputs: CalculatorInputs): CalculatorResults {
  const { 
    modelParams: N, 
    hardwareOps, 
    utilization, 
    inputLength, 
    responseLength, 
    thinkTime, 
    quantType,
    tokenBreakdown,
    coldStartRate = 0,
    gpuMemoryGB,
    useMoeArchitecture = false,
    expertShards = 1,
    useCustomModel = false,
    customTotalParams = 1,
    customActiveParams = 1,
    customTotalExperts = 8,
    customActiveExperts = 2
  } = inputs;

  // Convert boolean flag to modelName (skip if using custom model)
  const modelName = useCustomModel ? 'custom' : getModelNameFromParams(N, useMoeArchitecture);
  
  // Debug logging (can be removed in production)
  if (typeof window !== 'undefined' && (useMoeArchitecture || useCustomModel)) {
    console.log('🔧 MoE/Custom Model Active:', {
      isCustom: useCustomModel,
      totalParams: useCustomModel ? customTotalParams + 'B' : N + 'B',
      useMoeArchitecture,
      modelName,
      type: useCustomModel ? 'Custom Model Configuration' : 
            modelName === 'generic-moe' ? 'Generic MoE (8 experts, 2 active)' : 
            'Known MoE Architecture'
    });
  }

  // Use token breakdown if provided, otherwise use legacy inputLength/responseLength
  const tokens: TokenBreakdown = tokenBreakdown || {
    systemPromptTokens: 0,
    sessionHistoryTokens: 0,
    newInputTokens: inputLength,
    outputTokens: responseLength
  };

  // Get active parameters - use custom if provided, otherwise calculate
  let activeParams: number;
  if (useCustomModel) {
    activeParams = useMoeArchitecture ? customActiveParams : customTotalParams;
  } else {
    const architecture = getModelArchitecture(N, modelName);
    activeParams = getActiveParameters(N, architecture);
  }
  
  // Debug logging (can be removed in production)
  if (typeof window !== 'undefined' && (modelName || useCustomModel)) {
    const totalParams = useCustomModel ? customTotalParams : N;
    console.log('📊 Model Calculation:', {
      isCustom: useCustomModel,
      architecture: (useCustomModel && useMoeArchitecture) || (!useCustomModel && getModelArchitecture(N, modelName).isMoE) ? 'MoE' : 'Dense',
      totalParams: totalParams + 'B',
      activeParams: activeParams.toFixed(2) + 'B',
      reduction: useMoeArchitecture ? (((totalParams - activeParams) / totalParams) * 100).toFixed(1) + '% compute reduction' : 'N/A'
    });
  }

  const Q = quantEfficiency[quantType];
  
  // Determine hardware type for memory bandwidth
  const bw = memoryBandwidth[quantType].default;
  
  // Model memory footprint (GB) - uses VRAM params (all experts if no parallelism)
  const totalParamsForVRAM = useCustomModel ? customTotalParams : N;
  const modelSizeGB = calculateModelSize(totalParamsForVRAM, quantType, modelName, expertShards);
  
  // Legacy KV cache calculation for backward compatibility
  const kvCacheBytesPerToken = KV_CACHE_CONSTANT_1 * (N / KV_CACHE_CONSTANT_2) * (KV_CACHE_CONSTANT_3 * Math.sqrt(N)) * bytesPerParam[quantType];
  
  // Theoretical compute-bound limit - uses ACTIVE params for MoE
  const theoreticalCompute = hardwareOps / (THEORETICAL_CONSTANT * activeParams * BILLION);
  
  // Memory bandwidth limit
  const sequenceLength = inputLength + responseLength;
  const kvCacheSize = kvCacheBytesPerToken * sequenceLength / 1e9;
  const memoryBoundLimit = bw / (modelSizeGB + kvCacheSize);
  
  // Theoretical is minimum of compute and memory limits
  const theoretical = Math.min(theoreticalCompute, memoryBoundLimit);
  const isMemoryBound = memoryBoundLimit < theoreticalCompute;
  
  // Apply utilization and quantization efficiency for baseline
  let realistic = theoretical * utilization * Q;
  
  // Prefill overhead (legacy)
  let prefillOverhead = 0;
  if (inputLength > 100) {
    prefillOverhead = Math.min(PREFILL_MAX_OVERHEAD, (inputLength / PREFILL_SCALING_FACTOR) * PREFILL_BASE_OVERHEAD);
    realistic = realistic * (1 - prefillOverhead);
  }
  
  // Attention overhead (legacy)
  let attentionOverhead = 0;
  if (sequenceLength > ATTENTION_THRESHOLD) {
    attentionOverhead = Math.min(ATTENTION_MAX_OVERHEAD, ((sequenceLength - ATTENTION_THRESHOLD) / ATTENTION_SCALING_FACTOR) * ATTENTION_BASE_OVERHEAD);
    realistic = realistic * (1 - attentionOverhead);
  }
  
  const tokensPerSecPerUser = responseLength / thinkTime;
  const users = realistic / tokensPerSecPerUser;
  const words = realistic * 0.75;

  // Token-aware calculations if tokenBreakdown is provided
  let tokenCosts: TokenComputeCosts | undefined;
  let kvCache: KVCacheState | undefined;
  let vramAllocation: VRAMAllocation | undefined;

  if (tokenBreakdown && gpuMemoryGB) {
    // Session context = cached tokens (system prompt + session history)
    const sessionContextTokens = tokens.systemPromptTokens + tokens.sessionHistoryTokens;
    const totalSessionTokens = sessionContextTokens + tokens.newInputTokens + tokens.outputTokens;
    
    // Use correct parameter value for custom models
    const modelParamsForCalc = useCustomModel ? customTotalParams : N;
    
    // Calculate FLOPS per token (prefill uses ACTIVE params, decode uses TOTAL params)
    const prefillFlopsPerToken = calculatePrefillFlopsPerToken(modelParamsForCalc, TOKEN_FLOPS_PREFILL_K, modelName);
    const decodeFlopsPerToken = calculateDecodeFlopsPerToken(modelParamsForCalc, TOKEN_FLOPS_DECODE_K, modelName);
    
    // KV cache calculation - use model-specific architecture
    const kvBytesPerToken = calculateKVBytesPerToken(modelParamsForCalc, quantType, modelName);
    const kvMemoryPerSessionGB = (totalSessionTokens * kvBytesPerToken) / 1e9;
    
    // VRAM allocation - uses VRAM params (all experts unless expert parallelism)
    const modelSizeGB = calculateModelSize(modelParamsForCalc, quantType, modelName, expertShards);
    const safetyBufferGB = calculateVRAMSafetyBuffer(gpuMemoryGB);
    const totalUsedGB = modelSizeGB + kvMemoryPerSessionGB + safetyBufferGB;
    const availableGB = gpuMemoryGB - totalUsedGB;
    const canFitModel = totalUsedGB <= gpuMemoryGB;
    const warnings: string[] = [];
    
    if (!canFitModel) {
      warnings.push(`Model requires ${totalUsedGB.toFixed(1)}GB but only ${gpuMemoryGB}GB available`);
    }
    
    const availableForKV = gpuMemoryGB - modelSizeGB - safetyBufferGB;
    const maxSessionsPerGPU = availableForKV > 0 ? Math.floor(availableForKV / kvMemoryPerSessionGB) : 0;
    
    if (maxSessionsPerGPU < 1) {
      warnings.push(`Insufficient VRAM for even 1 session. Need ${kvMemoryPerSessionGB.toFixed(1)}GB more.`);
    }
    
    const kvUtilizationPercent = availableForKV > 0 
      ? (kvMemoryPerSessionGB / availableForKV) * 100 
      : 0;
    
    tokenCosts = {
      prefillFlopsPerToken,
      decodeFlopsPerToken,
      kvBytesPerToken
    };
    
    kvCache = {
      totalSessionTokens,
      kvMemoryGB: kvMemoryPerSessionGB,
      maxSessionsPerGPU,
      kvUtilizationPercent
    };
    
    vramAllocation = {
      modelWeightsGB: modelSizeGB,
      kvCacheGB: kvMemoryPerSessionGB,
      safetyBufferGB,
      totalUsedGB,
      availableGB,
      canFitModel,
      warnings,
      offloadedMemoryGB: undefined  // No offloading in this code path
    };
  }

  return {
    theoretical,
    realistic,
    users,
    tokensPerSecPerUser,
    words,
    isMemoryBound,
    prefillOverhead,
    attentionOverhead,
    tokenCosts,
    kvCache,
    vramAllocation
  };
}

/**
 * Calculate realistic batching strategy based on actual LLM inference constraints
 * 
 * REALISTIC INFERENCE ASSUMPTIONS:
 * - Batch sizes: 16-64 typical, 128 max for large GPUs
 * - Activation memory: ~20-30% of model size per batch
 * - Attention buffers: significant memory overhead
 * - KV cache offloading: reduces VRAM but NOT compute
 * - H100 70B throughput: 1500-3000 tokens/sec at optimal batch size
 * 
 * @param gpuMemoryGB - Available VRAM per GPU
 * @param modelSizeGB - Model weights size
 * @param kvCachePerRequestGB - KV cache memory per request (0 if offloaded)
 * @param totalUsers - Total concurrent users
 * @param tokensPerRequest - Tokens processed per request
 * @param modelParams - Model parameters in billions
 * @param numGPUs - Number of GPUs available
 * @returns Realistic batching configuration
 */
function calculateBatchingStrategy(
  gpuMemoryGB: number,
  modelSizeGB: number,
  kvCachePerRequestGB: number,
  totalUsers: number,
  tokensPerRequest: number,
  modelParams: number,
  numGPUs: number = 1
): BatchingStrategy {
  // REALISTIC CONSTANTS (based on actual inference systems)
  const ACTIVATION_MEMORY_PER_REQUEST_GB = 0.05; // ~50MB per request for activations (conservative)
  const ATTENTION_BUFFER_GB = 2.0; // Fixed attention buffer overhead
  const MIN_REALISTIC_BATCH = 8; // Below this, GPU is severely underutilized
  const MAX_REALISTIC_BATCH = 128; // Hard limit even with KV offloading
  const OPTIMAL_BATCH_RANGE = [16, 64]; // Sweet spot for most models
  
  // Step 1: Check if model needs tensor parallelism (model sharding across GPUs)
  const safetyBufferGB = calculateVRAMSafetyBuffer(gpuMemoryGB);
  const minGPUsForModel = Math.ceil((modelSizeGB + safetyBufferGB + ATTENTION_BUFFER_GB) / gpuMemoryGB);
  
  // If model doesn't fit in one GPU, use tensor parallelism
  // Each GPU holds 1/N of the model weights
  const actualNumGPUs = Math.max(numGPUs, minGPUsForModel);
  const modelSizePerGPU = modelSizeGB / actualNumGPUs;
  
  // Calculate available memory after model shard and buffers
  const baseMemoryUsed = modelSizePerGPU + safetyBufferGB + ATTENTION_BUFFER_GB;
  const availableForBatching = gpuMemoryGB - baseMemoryUsed;
  
  if (availableForBatching <= 0) {
    // Even with tensor parallelism, can't fit - need to recommend larger GPUs
    return createFailedBatchingStrategy(totalUsers, actualNumGPUs, `Model requires ${minGPUsForModel} GPUs with tensor parallelism, but still insufficient VRAM. Consider larger GPUs or more aggressive quantization.`);
  }
  
  // Step 2: Calculate REALISTIC max batch size
  // Memory per request = KV cache + activation memory (~50MB per request, not 25% of model!)
  const memoryPerRequest = kvCachePerRequestGB + ACTIVATION_MEMORY_PER_REQUEST_GB;
  
  let maxBatchSizeVRAM = memoryPerRequest > 0 
    ? Math.floor(availableForBatching / memoryPerRequest)
    : MAX_REALISTIC_BATCH;
  
  // Hard cap at realistic maximum
  maxBatchSizeVRAM = Math.min(maxBatchSizeVRAM, MAX_REALISTIC_BATCH);
  
  // Step 3: Determine optimal batch size using unified equation
  const optimalBatchSize = Eq.getOptimalBatchSize(modelParams);
  
  // Constrain by VRAM and user count
  const constrainedOptimalSize = Math.min(optimalBatchSize, maxBatchSizeVRAM, totalUsers);
  const finalOptimalSize = Math.max(constrainedOptimalSize, MIN_REALISTIC_BATCH);
  
  // Step 4: Use optimal batch size unless VRAM-constrained
  const requestsPerBatch = Math.min(finalOptimalSize, maxBatchSizeVRAM);
  
  // Step 5: Calculate batches needed
  const totalRequestsPerGPU = Math.ceil(totalUsers / actualNumGPUs);
  const numBatchesPerGPU = Math.ceil(totalRequestsPerGPU / requestsPerBatch);
  const totalBatches = numBatchesPerGPU * actualNumGPUs;
  
  // Step 6: Calculate memory per batch
  const kvCachePerBatch = kvCachePerRequestGB * requestsPerBatch;
  const activationsPerBatch = ACTIVATION_MEMORY_PER_REQUEST_GB * requestsPerBatch;
  const totalBatchMemory = kvCachePerBatch + activationsPerBatch;
  
  // Step 7: Realistic throughput calculation using batch efficiency
  const batchEfficiency = Eq.calculateBatchEfficiency(requestsPerBatch, optimalBatchSize);
  
  let baseTokensPerSec: number;
  if (modelParams >= 65) {
    baseTokensPerSec = 1500 + (batchEfficiency * 1500);
  } else if (modelParams >= 30) {
    baseTokensPerSec = 3000 + (batchEfficiency * 2000);
  } else if (modelParams >= 10) {
    baseTokensPerSec = 5000 + (batchEfficiency * 3000);
  } else {
    baseTokensPerSec = 8000 + (batchEfficiency * 7000);
  }
  
  const throughputPerGPU = baseTokensPerSec;
  
  // Step 8: Realistic latency (prefill + decode)
  // Prefill: ~40-60ms for 512 tokens
  // Decode: ~10-20ms per token
  const prefillLatencyMs = 50; // Average for 512 tokens
  const decodeLatencyMs = 15 * tokensPerRequest; // ~15ms per output token
  const actualLatencyMs = prefillLatencyMs + decodeLatencyMs;
  
  // Step 9: GPU utilization
  const memoryUtilization = ((baseMemoryUsed + totalBatchMemory) / gpuMemoryGB) * 100;
  const computeUtilization = Math.min(90, 40 + (batchEfficiency * 50)); // 40-90% range
  const utilizationPercent = Math.min(memoryUtilization, computeUtilization);
  
  // Step 10: Determine constraints
  const vramLimited = maxBatchSizeVRAM < optimalBatchSize;
  const computeLimited = !vramLimited && requestsPerBatch >= optimalBatchSize;
  const latencyLimited = false; // Not using latency constraints in realistic model
  
  // Step 11: Generate realistic recommendations
  const recommendations: string[] = [];
  
  if (minGPUsForModel > 1) {
    recommendations.push(`⚙️ Model requires tensor parallelism across ${minGPUsForModel} GPUs (${modelSizeGB.toFixed(0)}GB model / ${gpuMemoryGB}GB per GPU).`);
  }
  
  if (vramLimited) {
    recommendations.push(`VRAM-limited: Batch size reduced to ${requestsPerBatch} (optimal: ${optimalBatchSize}). Consider KV offloading or larger GPUs.`);
  }
  
  if (requestsPerBatch < MIN_REALISTIC_BATCH) {
    recommendations.push(`⚠️ Batch size ${requestsPerBatch} is too small for efficient inference. GPU will be severely underutilized.`);
  }
  
  if (requestsPerBatch >= OPTIMAL_BATCH_RANGE[0] && requestsPerBatch <= OPTIMAL_BATCH_RANGE[1]) {
    recommendations.push(`✓ Batch size ${requestsPerBatch} is in optimal range for this model size.`);
  }
  
  if (kvCachePerRequestGB === 0 && memoryPerRequest > 0) {
    recommendations.push(`KV cache offloaded to CPU/NVMe. Activation memory requires ${ACTIVATION_MEMORY_PER_REQUEST_GB.toFixed(3)}GB per request.`);
  }
  
  if (computeUtilization < 60) {
    recommendations.push(`GPU underutilized (${computeUtilization.toFixed(0)}%). Consider increasing batch size or reducing GPU count.`);
  }
  
  return {
    maxBatchSizePerGPU: maxBatchSizeVRAM,
    optimalBatchSize,
    numBatchesPerGPU,
    totalBatches,
    requestsPerBatch,
    kvCachePerBatch: totalBatchMemory, // Total memory per batch (KV + activations)
    latencyMs: actualLatencyMs,
    throughputPerGPU,
    utilizationPercent,
    constraints: {
      vramLimited,
      computeLimited,
      latencyLimited
    },
    recommendations
  };
}

function createFailedBatchingStrategy(totalUsers: number, numGPUs: number, reason: string): BatchingStrategy {
  return {
    maxBatchSizePerGPU: 0,
    optimalBatchSize: 0,
    numBatchesPerGPU: 0,
    totalBatches: 0,
    requestsPerBatch: 0,
    kvCachePerBatch: 0,
    latencyMs: 0,
    throughputPerGPU: 0,
    utilizationPercent: 0,
    constraints: {
      vramLimited: true,
      computeLimited: false,
      latencyLimited: false
    },
    recommendations: [`❌ ${reason}`]
  };
}

export function calculateReverseInfrastructure(inputs: ReverseCalculatorInputs): ReverseCalculatorResults {
  const { 
    modelParams: N, 
    users, 
    inputLength, 
    tokensPerUser, 
    hardwareOpsPerUnit, 
    utilization, 
    quantType,
    tokenBreakdown,
    coldStartRate = 0,
    gpuMemoryGB,
    kvOffloading = false,
    kvOffloadingPercentage = 100, // Default to 100% offloading when kvOffloading is true
    useMoeArchitecture = false,
    expertShards = 1,
    useCustomModel = false,
    customTotalParams = 1,
    customActiveParams = 1,
    customTotalExperts = 8,
    customActiveExperts = 2
  } = inputs;
  
  // Convert boolean flag to modelName (skip if using custom model)
  const modelName = useCustomModel ? 'custom' : getModelNameFromParams(N, useMoeArchitecture);
  
  // Use token breakdown if provided
  const tokens: TokenBreakdown = tokenBreakdown || {
    systemPromptTokens: 0,
    sessionHistoryTokens: 0,
    newInputTokens: inputLength,
    outputTokens: tokensPerUser
  };
  
  // Get active parameters - use custom if provided, otherwise calculate
  let activeParams: number;
  if (useCustomModel) {
    activeParams = useMoeArchitecture ? customActiveParams : customTotalParams;
  } else {
    const architecture = getModelArchitecture(N, modelName);
    activeParams = getActiveParameters(N, architecture);
  }
  
  const Q = quantEfficiency[quantType];
  
  // Required tokens/sec for all users
  const totalOutputTokensPerSec = users * tokensPerUser;
  
  // Overhead calculations
  let overheadMultiplier = 1.0;
  const overheadBreakdown: string[] = [];
  
  // Prefill overhead - only apply to NEW tokens being processed, not cached tokens
  const effectiveInputLength = tokenBreakdown ? tokens.newInputTokens : inputLength;
  let prefillOverhead = 0;
  if (effectiveInputLength > 100) {
    prefillOverhead = Math.min(PREFILL_MAX_OVERHEAD, (effectiveInputLength / PREFILL_SCALING_FACTOR) * PREFILL_BASE_OVERHEAD);
    overheadMultiplier *= (1 + prefillOverhead);
    overheadBreakdown.push(`+${(prefillOverhead * 100).toFixed(0)}% prefill`);
  }
  
  // Attention overhead - only apply to active sequence length
  const effectiveSequenceLength = tokenBreakdown 
    ? (tokens.newInputTokens + tokens.outputTokens)  // Only new tokens in KV cache mode
    : (inputLength + (tokensPerUser * 5));  // Full sequence in non-KV mode
  let attentionOverhead = 0;
  if (effectiveSequenceLength > ATTENTION_THRESHOLD) {
    attentionOverhead = Math.min(ATTENTION_MAX_OVERHEAD, ((effectiveSequenceLength - ATTENTION_THRESHOLD) / ATTENTION_SCALING_FACTOR) * ATTENTION_BASE_OVERHEAD);
    overheadMultiplier *= (1 + attentionOverhead);
    overheadBreakdown.push(`+${(attentionOverhead * 100).toFixed(0)}% attention`);
  }
  
  // Redundancy factor
  const redundancyFactor = REDUNDANCY_FACTOR;
  overheadMultiplier *= redundancyFactor;
  overheadBreakdown.push('+15% redundancy');
  
  const effectiveTokensPerSec = totalOutputTokensPerSec * overheadMultiplier;
  
  // Calculate model size (VRAM requirements - all experts unless expert parallelism)
  const modelSizeGB = calculateModelSize(N, quantType, modelName, expertShards);
  
  // Calculate total tokens per request based on KV cache mode
  let tokensPerRequest: number;
  let totalTokensPerSec: number;
  
  if (tokenBreakdown) {
    // KV Cache Mode: Continuous serving with decode-dominant workload
    // Use unified equation for throughput calculation
    const servingRate = Eq.calculateContinuousServingRate(
      users,
      tokens.outputTokens,
      tokens.newInputTokens,
      Eq.DEFAULT_REQUEST_FREQUENCY
    );
    
    totalTokensPerSec = servingRate.totalRate;
    tokensPerRequest = tokens.newInputTokens + (tokens.outputTokens / Eq.DEFAULT_REQUEST_FREQUENCY);
    
    console.log('📊 Token Throughput Breakdown:', {
      decodeRate: Eq.formatNumber(servingRate.decodeRate) + ' t/s (dominant)',
      prefillRate: Eq.formatNumber(servingRate.prefillRate) + ' t/s (amortized)',
      totalRate: Eq.formatNumber(servingRate.totalRate) + ' t/s',
      decodePercent: servingRate.decodePercentage.toFixed(1) + '%'
    });
  } else {
    // Non-KV Cache Mode: All input tokens are processed every request
    tokensPerRequest = inputLength + tokensPerUser;
    totalTokensPerSec = tokensPerUser * users;
  }
  
  // Calculate hardware needed based on FLOPS
  // For MoE models in continuous serving: decode dominates (95%), prefill is 5%
  const effectiveParams = Eq.calculateEffectiveParams(activeParams, N, !!tokenBreakdown);
  
  // Use unified FLOPS calculation
  const hardwareOpsNeeded = Eq.calculateRequiredFLOPS(
    totalTokensPerSec,
    effectiveParams,
    overheadMultiplier,
    utilization,
    Q
  );
  let unitsNeeded: number;
  
  console.log('🔍 COMPUTE CALCULATION BREAKDOWN:');
  console.log('  totalTokensPerSec:', Eq.formatNumber(totalTokensPerSec));
  console.log('  effectiveParams:', effectiveParams.toFixed(2), 'billion');
  console.log('  overheadMultiplier:', overheadMultiplier.toFixed(4));
  console.log('  utilization:', utilization);
  console.log('  Q (quantization):', Q);
  console.log('  requiredFLOPS:', Eq.formatFLOPS(hardwareOpsNeeded));
  console.log('  hardwarePerUnit:', Eq.formatFLOPS(hardwareOpsPerUnit));
  console.log('  computeBasedUnits:', Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit), 'GPUs');
  
  // Two GPU calculation modes based on KV offloading
  if (kvOffloading && kvOffloadingPercentage > 0) {
    // WITH KV Offloading: Percentage of KV cache stored in CPU RAM/NVMe
    // GPU count optimized based on available VRAM and compute requirements
    const computeBasedUnits = Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit);
    
    // Calculate how much KV cache to keep in VRAM vs offload
    if (gpuMemoryGB && tokenBreakdown) {
      const safetyBufferGB = calculateVRAMSafetyBuffer(gpuMemoryGB);
      const modelParamsForCalc = useCustomModel ? customTotalParams : N;
      
      // Calculate total KV cache needed
      const sessionContextTokens = tokens.systemPromptTokens + tokens.sessionHistoryTokens;
      const totalSessionTokens = sessionContextTokens + tokens.newInputTokens + tokens.outputTokens;
      const kvBytesPerToken = calculateKVBytesPerToken(modelParamsForCalc, quantType, modelName);
      const totalKVCacheGB = Eq.calculateTotalKVCache(totalSessionTokens, kvBytesPerToken, users);
      
      // Split KV cache using unified equation
      const kvSplit = Eq.splitKVCache(totalKVCacheGB, kvOffloadingPercentage);
      
      // Calculate GPU requirements using unified equation
      const gpuReq = Eq.calculateOptimalGPUs(
        hardwareOpsNeeded,
        hardwareOpsPerUnit,
        modelSizeGB,
        kvSplit.inVRAM,
        gpuMemoryGB,
        safetyBufferGB,
        Eq.ATTENTION_BUFFER_GB
      );
      
      unitsNeeded = gpuReq.optimalGPUs;
      
      console.log('🔄 Partial KV Offloading:', {
        offloadingPercentage: kvOffloadingPercentage + '%',
        totalKVCache: Eq.formatMemory(kvSplit.totalGB),
        kvInVRAM: Eq.formatMemory(kvSplit.inVRAM),
        kvOffloaded: Eq.formatMemory(kvSplit.offloaded),
        computeGPUs: gpuReq.computeGPUs,
        vramGPUs: gpuReq.vramGPUs,
        optimalGPUs: gpuReq.optimalGPUs,
        isComputeBound: gpuReq.isComputeBound,
        tensorParallelism: gpuReq.tensorParallelismRequired,
        modelSize: Eq.formatMemory(modelSizeGB)
      });
      
      if (gpuReq.optimalGPUs > gpuReq.computeGPUs) {
        overheadBreakdown.push(`🔄 ${kvOffloadingPercentage}% KV offloading - VRAM-bound: ${gpuReq.optimalGPUs} GPUs (${kvSplit.inVRAM.toFixed(1)}GB in VRAM, ${kvSplit.offloaded.toFixed(1)}GB offloaded)`);
      } else {
        overheadBreakdown.push(`🔄 ${kvOffloadingPercentage}% KV offloading - Compute-bound: ${gpuReq.optimalGPUs} GPUs (${kvSplit.offloaded.toFixed(1)}GB offloaded to CPU/NVMe)`);
      }
    } else {
      // No GPU memory info or token breakdown - fall back to compute-based
      const computeBasedUnits = Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit);
      unitsNeeded = computeBasedUnits;
      overheadBreakdown.push(`✓ ${kvOffloadingPercentage}% KV offloading enabled: GPU count based on compute`);
    }
  } else if (kvOffloading) {
    // Full KV Offloading (100%): KV cache stored in CPU RAM/NVMe
    // GPU count based ONLY on compute (FLOPs required)
    const computeBasedUnits = Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit);
    
    // But still need to ensure model can fit in VRAM (without KV cache)
    if (gpuMemoryGB) {
      const safetyBufferGB = calculateVRAMSafetyBuffer(gpuMemoryGB);
      const requiredVRAM = modelSizeGB + safetyBufferGB;
      const vramBasedUnits = Math.ceil(requiredVRAM / gpuMemoryGB);
      
      console.log('✓ KV Offloading ON:', {
        computeBasedUnits,
        vramBasedUnits,
        requiredVRAM: requiredVRAM.toFixed(1),
        modelSize: modelSizeGB.toFixed(1),
        safetyBuffer: safetyBufferGB.toFixed(1)
      });
      
      // Take maximum of compute and model-fit requirements
      unitsNeeded = Math.max(computeBasedUnits, vramBasedUnits);
      
      if (computeBasedUnits > vramBasedUnits) {
        overheadBreakdown.push(`✓ KV offloading ON - Compute-bound: ${computeBasedUnits} GPUs (${vramBasedUnits} for model VRAM)`);
      } else {
        overheadBreakdown.push(`✓ KV offloading ON - VRAM-bound: ${vramBasedUnits} GPUs for ${requiredVRAM.toFixed(1)}GB model (compute needs ${computeBasedUnits})`);
      }
    } else {
      unitsNeeded = computeBasedUnits;
      overheadBreakdown.push('✓ KV offloading enabled: GPU count based on compute only');
    }
  } else {
    // WITHOUT KV Offloading: KV cache must fit in GPU memory
    // GPU count based on VRAM (model + KV cache must fit)
    if (gpuMemoryGB && tokenBreakdown) {
      const safetyBufferGB = calculateVRAMSafetyBuffer(gpuMemoryGB);
      const ATTENTION_BUFFER_GB = 2.0;
      
      // Use correct parameter value for custom models
      const modelParamsForCalc = useCustomModel ? customTotalParams : N;
      
      // Calculate KV cache memory requirements
      const sessionContextTokens = tokens.systemPromptTokens + tokens.sessionHistoryTokens;
      const totalSessionTokens = sessionContextTokens + tokens.newInputTokens + tokens.outputTokens;
      const kvBytesPerToken = calculateKVBytesPerToken(modelParamsForCalc, quantType, modelName);
      const kvMemoryPerSessionGB = (totalSessionTokens * kvBytesPerToken) / 1e9;
      
      // Step 1: Determine minimum GPUs needed for model (with tensor parallelism)
      const modelOnlyVRAM = modelSizeGB + safetyBufferGB + ATTENTION_BUFFER_GB;
      const minGPUsForModel = Math.ceil(modelOnlyVRAM / gpuMemoryGB);
      
      // Step 2: Calculate KV cache per GPU (distributed across all GPUs)
      // Each GPU handles a shard of users
      const kvMemoryPerGPU = (kvMemoryPerSessionGB * users) / minGPUsForModel;
      const modelShardPerGPU = modelSizeGB / minGPUsForModel;
      
      // Step 3: Check if model shard + KV cache fits in a single GPU
      const vramPerGPU = modelShardPerGPU + kvMemoryPerGPU + safetyBufferGB + ATTENTION_BUFFER_GB;
      
      // Step 4: If still doesn't fit, need more GPUs
      let vramBasedUnits = minGPUsForModel;
      if (vramPerGPU > gpuMemoryGB) {
        // Need even more GPUs to fit KV cache
        // Total VRAM needed = model + (KV per session × users) + buffers
        const totalVRAMNeeded = modelSizeGB + (kvMemoryPerSessionGB * users) + (safetyBufferGB * minGPUsForModel) + (ATTENTION_BUFFER_GB * minGPUsForModel);
        vramBasedUnits = Math.ceil(totalVRAMNeeded / gpuMemoryGB);
      }
      
      const kvMemoryNeeded = kvMemoryPerSessionGB * users;
      
      console.log('✗ KV Offloading OFF - VRAM with Tensor Parallelism:', {
        modelSize: modelSizeGB.toFixed(1),
        minGPUsForModel,
        modelShardPerGPU: modelShardPerGPU.toFixed(1),
        kvMemoryPerGPU: kvMemoryPerGPU.toFixed(1),
        kvMemoryTotal: kvMemoryNeeded.toFixed(1),
        vramPerGPU: vramPerGPU.toFixed(1),
        gpuVRAM: gpuMemoryGB,
        vramBasedUnits
      });
      
      overheadBreakdown.push(`✗ KV in GPU VRAM: ${kvMemoryNeeded.toFixed(1)}GB for ${users} sessions`);
      if (minGPUsForModel > 1) {
        overheadBreakdown.push(`⚙️ Tensor parallelism: Model split across ${minGPUsForModel}+ GPUs`);
      }
      
      // Also check compute-based requirement and take the maximum
      const computeBasedUnits = Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit);
      
      console.log('✗ KV Offloading OFF - Units calculation:', {
        vramBasedUnits,
        computeBasedUnits,
        isComputeBound: computeBasedUnits > vramBasedUnits
      });
      
      if (computeBasedUnits > vramBasedUnits) {
        unitsNeeded = computeBasedUnits;
        overheadBreakdown.push(`Compute-bound: ${computeBasedUnits} GPUs (${vramBasedUnits} needed for VRAM)`);
      } else {
        unitsNeeded = vramBasedUnits;
        overheadBreakdown.push(`VRAM-bound: ${vramBasedUnits} GPUs with tensor parallelism`);
      }
    } else if (gpuMemoryGB) {
      // No KV cache mode, just model size
      const safetyBufferGB = calculateVRAMSafetyBuffer(gpuMemoryGB);
      const requiredVRAM = modelSizeGB + safetyBufferGB;
      const vramBasedUnits = Math.ceil(requiredVRAM / gpuMemoryGB);
      const computeBasedUnits = Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit);
      
      unitsNeeded = Math.max(vramBasedUnits, computeBasedUnits);
      
      if (computeBasedUnits > vramBasedUnits) {
        overheadBreakdown.push(`Compute-bound: ${computeBasedUnits} GPUs (${vramBasedUnits} for model VRAM)`);
      } else {
        overheadBreakdown.push(`VRAM-bound: ${vramBasedUnits} GPUs for ${requiredVRAM.toFixed(1)}GB model`);
      }
    } else {
      // Fallback if no GPU memory specified - use compute-based calculation
      unitsNeeded = Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit);
      overheadBreakdown.push('GPU count based on compute (no VRAM info available)');
    }
  }
  
  // Final validation - ensure unitsNeeded is a valid number
  if (!unitsNeeded || isNaN(unitsNeeded) || unitsNeeded < 1) {
    unitsNeeded = Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit);
  }
  
  // Calculate actual throughput
  const theoreticalPerUnit = (hardwareOpsPerUnit / (6 * N * 1e9)) * utilization * Q;
  const throughputPerUnit = theoreticalPerUnit / overheadMultiplier;
  const totalSystemThroughput = throughputPerUnit * unitsNeeded;
  const headroom = ((totalSystemThroughput - totalOutputTokensPerSec) / totalOutputTokensPerSec * 100);
  const totalOverheadPercent = ((overheadMultiplier - 1) * 100);

  // Token-aware calculations if tokenBreakdown is provided
  let tokenCosts: TokenComputeCosts | undefined;
  let kvCache: KVCacheState | undefined;
  let vramAllocation: VRAMAllocation | undefined;
  let batchingStrategy: BatchingStrategy | undefined;

  if (tokenBreakdown && gpuMemoryGB) {
    // Session context = cached tokens (system prompt + session history)
    const sessionContextTokens = tokens.systemPromptTokens + tokens.sessionHistoryTokens;
    const totalSessionTokens = sessionContextTokens + tokens.newInputTokens + tokens.outputTokens;
    
    // Use correct parameter value for custom models
    const modelParamsForCalc = useCustomModel ? customTotalParams : N;
    
    // Calculate FLOPS per token (prefill uses ACTIVE params, decode uses TOTAL params)
    const prefillFlopsPerToken = calculatePrefillFlopsPerToken(modelParamsForCalc, TOKEN_FLOPS_PREFILL_K, modelName);
    const decodeFlopsPerToken = calculateDecodeFlopsPerToken(modelParamsForCalc, TOKEN_FLOPS_DECODE_K, modelName);
    
    // Per-request FLOPS (only new input + output)
    const prefillFlopsPerRequest = tokens.newInputTokens * prefillFlopsPerToken;
    const decodeFlopsPerRequest = tokens.outputTokens * decodeFlopsPerToken;
    const totalFlopsPerRequest = prefillFlopsPerRequest + decodeFlopsPerRequest;
    
    // Cold start overhead (cached tokens need prefill on first load)
    const coldStartFlops = sessionContextTokens * prefillFlopsPerToken * coldStartRate;
    const effectiveFlopsPerRequest = totalFlopsPerRequest + coldStartFlops;
    
    // KV cache calculation using model-specific architecture
    const kvBytesPerToken = calculateKVBytesPerToken(modelParamsForCalc, quantType, modelName);
    const kvMemoryPerSessionGB = (totalSessionTokens * kvBytesPerToken) / 1e9;
    
    // VRAM allocation - uses VRAM params (all experts unless expert parallelism)
    const modelSizeGB = calculateModelSize(modelParamsForCalc, quantType, modelName, expertShards);
    const safetyBufferGB = calculateVRAMSafetyBuffer(gpuMemoryGB);
    const availableForKV = gpuMemoryGB - modelSizeGB - safetyBufferGB;
    const maxConcurrentSessions = Math.floor(availableForKV / kvMemoryPerSessionGB);
    
    tokenCosts = {
      prefillFlopsPerToken,
      decodeFlopsPerToken,
      kvBytesPerToken
    };
    
    // Calculate total KV cache for all users
    const totalKVCacheGB = kvMemoryPerSessionGB * users;
    
    // Calculate offloading split using unified equation
    let kvSplit: Eq.KVCacheSplit;
    let offloadingPercentage = 0;
    
    if (kvOffloading) {
      offloadingPercentage = kvOffloadingPercentage || 100;
      kvSplit = Eq.splitKVCache(totalKVCacheGB, offloadingPercentage);
    } else {
      // No offloading - all in VRAM
      kvSplit = {
        totalGB: totalKVCacheGB,
        inVRAM: totalKVCacheGB,
        offloaded: 0,
        percentage: 0
      };
    }
    
    // Calculate VRAM usage
    const totalUsedGB = modelSizeGB + kvSplit.inVRAM + safetyBufferGB;
    const availableGB = gpuMemoryGB - totalUsedGB;
    const canFitModel = totalUsedGB <= gpuMemoryGB;
    const warnings: string[] = [];
    
    if (!canFitModel) {
      warnings.push(`Model requires ${totalUsedGB.toFixed(1)}GB but only ${gpuMemoryGB}GB available`);
    }
    if (!kvOffloading && maxConcurrentSessions < users) {
      warnings.push(`GPU can fit ${maxConcurrentSessions} sessions but ${users} users requested. Need ${((users - maxConcurrentSessions) * kvMemoryPerSessionGB).toFixed(1)}GB more.`);
    }
    
    const kvUtilizationPercent = kvSplit.inVRAM > 0
      ? (gpuMemoryGB > 0 ? (kvSplit.inVRAM / (gpuMemoryGB - modelSizeGB - safetyBufferGB)) * 100 : 0)
      : 0;
    
    kvCache = {
      totalSessionTokens,
      kvMemoryGB: kvMemoryPerSessionGB,
      maxSessionsPerGPU: kvOffloading ? Infinity : maxConcurrentSessions,
      kvUtilizationPercent
    };
    
    vramAllocation = {
      modelWeightsGB: modelSizeGB,
      kvCacheGB: kvSplit.inVRAM > 0 ? (kvSplit.inVRAM / users) : 0,
      safetyBufferGB,
      totalUsedGB,
      availableGB,
      canFitModel,
      warnings,
      offloadedMemoryGB: kvSplit.offloaded > 0 ? kvSplit.offloaded : undefined,
      offloadingPercentage: kvOffloading ? offloadingPercentage : undefined,
      kvCacheInVRAM: kvSplit.inVRAM > 0 ? kvSplit.inVRAM : undefined,
      kvCacheOffloaded: kvSplit.offloaded > 0 ? kvSplit.offloaded : undefined
    };
    
    // Calculate batching strategy FIRST (before final GPU count)
    const kvCachePerRequestGB = kvOffloading ? 0 : kvMemoryPerSessionGB;
    const tokensPerRequestCalc = tokens.newInputTokens + tokens.outputTokens;
    
    // Initial estimate for batching (use compute-based units as starting point)
    const initialGPUEstimate = Math.max(1, Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit));
    
    batchingStrategy = calculateBatchingStrategy(
      gpuMemoryGB,
      modelSizeGB,
      kvCachePerRequestGB,
      users,
      tokensPerRequestCalc,
      modelParamsForCalc,
      initialGPUEstimate
    );
    
    // RECALCULATE GPU count based on realistic throughput
    // Total demand: users × OUTPUT tokens/sec (not total tokens per request!)
    const outputTokensPerSec = tokens.outputTokens; // This is the rate, e.g., 10 tokens/sec
    const totalTokenDemand = users * outputTokensPerSec;
    const throughputBasedUnits = Math.ceil(totalTokenDemand / batchingStrategy.throughputPerGPU);
    
    // Use the MAXIMUM of VRAM-based and throughput-based
    // (Must satisfy both constraints)
    const computeBasedUnits = Math.ceil(hardwareOpsNeeded / hardwareOpsPerUnit);
    const realisticUnits = Math.max(throughputBasedUnits, unitsNeeded); // unitsNeeded already accounts for VRAM
    
    console.log('🎯 Realistic GPU Calculation:', {
      vramBasedUnits: unitsNeeded,
      oldComputeBasedUnits: computeBasedUnits,
      throughputBasedUnits,
      throughputPerGPU: batchingStrategy.throughputPerGPU.toFixed(0) + ' t/s',
      outputTokensPerSec,
      totalDemand: totalTokenDemand.toFixed(0) + ' t/s',
      finalUnits: realisticUnits
    });
    
    // Update with realistic GPU count
    unitsNeeded = realisticUnits;
    
    // Update batching strategy with final GPU count
    batchingStrategy = calculateBatchingStrategy(
      gpuMemoryGB,
      modelSizeGB,
      kvCachePerRequestGB,
      users,
      tokensPerRequestCalc,
      modelParamsForCalc,
      unitsNeeded
    );
  }

  return {
    unitsNeeded,
    throughputPerUnit,
    totalSystemThroughput,
    headroom,
    totalOverheadPercent,
    overheadBreakdown,
    tokenCosts,
    kvCache,
    vramAllocation,
    batchingStrategy
  };
}

export function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals);
}

export function formatNumberWithCommas(num: number): string {
  return Math.round(num).toLocaleString();
}
