import { BILLION, calculateKVBytesPerToken, calculateDecodeFlopsPerToken } from '../calculationParameters';
import { ReverseCalculatorResults, TokenBreakdown } from '../types';

export interface CpuSizingInputs {
  N: number;
  hardwareOpsPerUnit: number;
  utilization: number;
  Q: number;
  users: number;
  tokensPerUser: number;
  inputLength: number;
  responseLength: number;
  thinkTime: number;
  cpuPrefillMultiplier?: number;
  cpuUtilizationTarget?: number;
  cpuRedundancy?: number;
  cpuAMXEfficiency?: number;
  cpuModelRamOverhead?: number;
  // Optional token-aware inputs for KV memory calculation
  tokenBreakdown?: TokenBreakdown;
  quantType?: 'fp16' | 'int8' | 'int4';
  kvOffloading?: boolean; // not used for CPU but included for parity
  kvOffloadingPercentage?: number;
  activeKvFraction?: number; // fraction of users with active KV resident (0..1)
}

export function calculateCpuSizing(inputs: CpuSizingInputs): ReverseCalculatorResults {
  const {
    N,
    hardwareOpsPerUnit,
    utilization,
    Q,
    users,
    tokensPerUser,
    inputLength,
    responseLength,
    thinkTime,
    cpuPrefillMultiplier = 2.5,
    cpuUtilizationTarget = 0.65,
    cpuRedundancy = 1.15,
    cpuAMXEfficiency = 0.2,
    cpuModelRamOverhead = 1.2,
    tokenBreakdown,
    quantType = 'fp16',
    activeKvFraction = 1
  } = inputs;

  const notes: string[] = [];

  // Step 0/1: Model placement (memory only)
  const totalParamsAbsolute = N < 1000 ? (N * 1e9) : N; // fallback
  const modelRamGB = (totalParamsAbsolute / 1e9) * cpuModelRamOverhead;

  notes.push(`Model RAM ${modelRamGB.toFixed(2)}GB`);

  // Compute KV cache memory (if token breakdown provided)
  let kvTotalGB = 0;
  // Predeclare active KV variable for use in memory accounting
  let kvActiveGB_final: number | undefined = undefined;
  if (tokenBreakdown) {
    const seqTokens = tokenBreakdown.systemPromptTokens + tokenBreakdown.sessionHistoryTokens + tokenBreakdown.newInputTokens + tokenBreakdown.outputTokens;
    const kvBytesPerToken = calculateKVBytesPerToken(N, quantType, undefined);
    kvTotalGB = (seqTokens * kvBytesPerToken * users) / 1e9; // worst-case total (all users cached)
    // Apply active KV fraction (if provided) to compute the expected resident KV in memory
    const kvActiveGB = kvTotalGB * (activeKvFraction ?? 1);
    kvTotalGB = Number(kvTotalGB.toFixed(3));
    notes.push(`KV cache total ${kvTotalGB.toFixed(2)}GB (no offloading for CPU)`);
    if ((activeKvFraction ?? 1) < 1) {
      notes.push(`Effective KV (active ${((activeKvFraction ?? 1) * 100).toFixed(1)}%): ${(kvActiveGB).toFixed(2)}GB`);
    }
    // store active in a variable used below
    kvActiveGB_final = kvActiveGB;
  }

  // Step 2: Compute per token (use CPU multiplier)
  const flopsPerToken = calculateDecodeFlopsPerToken(N, undefined, 1, undefined, 'cpu'); // FLOPs/token
  const flopsPerTokenGFLOPS = (flopsPerToken / 1e9);

  // Derived total tokens/sec workload (requested throughput)
  const T_total = users * (tokensPerUser || (responseLength / Math.max(1, thinkTime)));
  const totalFlopsPerSec = flopsPerToken * T_total;

  // Step 3: Effective compute per CPU (sustained)
  const usableFlopsPerCPU = Math.max(1e-9, hardwareOpsPerUnit) * cpuAMXEfficiency; // FLOPs/s

  // Step 4: Target TPS per CPU using the formula: (usableFlopsPerCPU * cpuUtilizationTarget) / flopsPerToken
  // Note: Do NOT apply quantization efficiency (Q) here — TPS/CPU should be derived only from declared hardware/utilization/AMX efficiency
  const targetTPSPerCPU = flopsPerToken > 0 ? (usableFlopsPerCPU * cpuUtilizationTarget) / flopsPerToken : 0;

  // Compute-only CPU count based on compute formula (lower bound)
  const cpusCompute = targetTPSPerCPU > 0 ? (T_total / targetTPSPerCPU) : Infinity;

  // Step 5: Decode throughput reality check (empirical)
  // Use compute-based decode estimate (derived from computed TPS) for prefill path
  const cpusDecode = cpusCompute;

  // Step 6: Long-context prefill penalty (apply to compute-based estimate)
  const cpusWithPrefill = cpusDecode * cpuPrefillMultiplier;

  // Note: Do NOT re-apply utilization here (it was already used when computing TPS/CPU). Keep cpusWithPrefill as the utilization-aware estimate.

  // Step 7: Decide baseline CPUs: use the larger of compute-based or prefill-adjusted requirement
  const baselineCPUs = Math.max(cpusCompute, cpusWithPrefill);

  // Apply redundancy & maintenance overhead.
  // `cpuRedundancy` is expressed as a fractional percentage (e.g., 0.10 for 10%), so convert to a multiplier (1 + r)
  // Accept both styles: if caller supplies a multiplier (>1), use it directly; if they supply a fractional percent (e.g., 0.10), convert to multiplier
  const redundancyMultiplier = cpuRedundancy > 1 ? cpuRedundancy : (1 + cpuRedundancy);
  const finalCPUs = baselineCPUs * redundancyMultiplier;
  const finalCPUsRounded = Math.ceil(finalCPUs);

  // Add note about redundancy applied (if user supplied fractional percent, show percent; if multiplier, show multiplier)
  if (cpuRedundancy > 1) {
    notes.push(`Applied redundancy multiplier ${redundancyMultiplier.toFixed(2)} (input interpreted as multiplier)`);
  } else {
    notes.push(`Applied redundancy multiplier ${redundancyMultiplier.toFixed(2)} (cpuRedundancy ${(cpuRedundancy * 100).toFixed(1)}%)`);
  }

  // Delivered TPS should use the computed TPS per CPU (preferred) so manual cpuTps becomes a display-only value
  const deliveredTPS = finalCPUsRounded * targetTPSPerCPU;
  const sanityPass = deliveredTPS >= T_total;

  const headroom = ((deliveredTPS - T_total) / Math.max(1, T_total)) * 100;

  // Compute total memory requirements and per-CPU allocation
  const kvActiveGB = typeof kvActiveGB_final !== 'undefined' ? kvActiveGB_final : kvTotalGB;
  const totalMemoryGB = modelRamGB + kvActiveGB;
  const memoryPerCPU = finalCPUsRounded > 0 ? (totalMemoryGB / finalCPUsRounded) : totalMemoryGB;

  const cpuSizing = {
    modelRamGB: Number(modelRamGB.toFixed(3)),
    kvTotalGB: Number(kvTotalGB.toFixed(3)),
    // kvActiveGB shows the effective resident KV in memory after applying active fraction
    kvActiveGB: Number((kvActiveGB || kvTotalGB).toFixed(3)),
    totalMemoryGB: Number(totalMemoryGB.toFixed(3)),
    memoryPerCPU: Number(memoryPerCPU.toFixed(3)),
    flopsPerTokenGFLOPS: Number(flopsPerTokenGFLOPS.toFixed(3)),
    totalFlopsTFLOPS: Number((totalFlopsPerSec / 1e12).toFixed(3)),
    usableFlopsPerCPU: Number(usableFlopsPerCPU.toFixed(0)),
    targetTPSPerCPU: Number(targetTPSPerCPU.toFixed(6)),
    cpusCompute: Number(cpusCompute.toFixed(2)),
    cpusDecode: Number(cpusDecode.toFixed(2)),
    M_prefill: cpuPrefillMultiplier,
    cpusWithPrefill: Number(cpusWithPrefill.toFixed(2)),
    U_target: cpuUtilizationTarget,
    // cpusUtil removed to avoid double-utilization confusion; cpusWithPrefill is the prefill-adjusted figure
    redundancy: cpuRedundancy,
    finalCPUs: Number(finalCPUs.toFixed(2)),
    finalCPUsRounded,
    deliveredTPS: Number(deliveredTPS.toFixed(1)),
    sanityPass,
    notes
  };

  return {
    unitsNeeded: finalCPUsRounded,
    throughputPerUnit: targetTPSPerCPU,
    totalSystemThroughput: deliveredTPS,
    headroom,
    totalOverheadPercent: 0,
    overheadBreakdown: notes,
    cpuSizing
  };
}
