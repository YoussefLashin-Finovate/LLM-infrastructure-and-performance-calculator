import { BILLION } from '../calculationParameters';
import { ReverseCalculatorResults } from '../types';

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
  cpuTps?: number;
  cpuPrefillMultiplier?: number;
  cpuUtilizationTarget?: number;
  cpuRedundancy?: number;
  cpuAMXEfficiency?: number;
  cpuModelRamOverhead?: number;
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
    cpuTps = 8,
    cpuPrefillMultiplier = 2.5,
    cpuUtilizationTarget = 0.65,
    cpuRedundancy = 1.15,
    cpuAMXEfficiency = 0.2,
    cpuModelRamOverhead = 1.2
  } = inputs;

  const notes: string[] = [];

  // Step 0/1: Model placement (memory only)
  const totalParamsAbsolute = N < 1000 ? (N * 1e9) : N; // fallback
  const modelRamGB = (totalParamsAbsolute / 1e9) * cpuModelRamOverhead;

  notes.push(`Model RAM ${modelRamGB.toFixed(2)}GB`);

  // Step 2: Base FLOPs per token (theoretical lower bound)
  const flopsPerToken = 2 * totalParamsAbsolute; // FLOPs per token (unit: FLOPs)
  const flopsPerTokenGFLOPS = (flopsPerToken / 1e9);

  // Derived total FLOPs/sec for target workload
  const T_total = users * (tokensPerUser || (responseLength / Math.max(1, thinkTime)));
  const totalFlopsPerSec = flopsPerToken * T_total;

  // Step 3: Use sustained AMX efficiency rather than peak
  const usableFlopsPerCPU = Math.max(1e-9, hardwareOpsPerUnit) * cpuAMXEfficiency; // FLOPs/s

  // Step 4: Compute-only CPU count (lower bound)
  const cpusCompute = usableFlopsPerCPU > 0 ? (totalFlopsPerSec / usableFlopsPerCPU) : Infinity;

  // Step 5: Decode throughput reality check (empirical)
  const cpusDecode = T_total / cpuTps;

  // Step 6: Long-context prefill penalty
  const cpusWithPrefill = cpusDecode * cpuPrefillMultiplier;

  // Step 7: Utilization & headroom
  const cpusUtil = cpusWithPrefill / cpuUtilizationTarget;

  // Step 8: Redundancy & maintenance
  const finalCPUs = cpusUtil * cpuRedundancy;
  const finalCPUsRounded = Math.ceil(finalCPUs);

  const deliveredTPS = finalCPUsRounded * cpuTps * cpuUtilizationTarget;
  const sanityPass = deliveredTPS >= T_total;

  const headroom = ((deliveredTPS - T_total) / Math.max(1, T_total)) * 100;

  const cpuSizing = {
    modelRamGB: Number(modelRamGB.toFixed(3)),
    flopsPerTokenGFLOPS: Number(flopsPerTokenGFLOPS.toFixed(3)),
    totalFlopsTFLOPS: Number((totalFlopsPerSec / 1e12).toFixed(3)),
    usableFlopsPerCPU: Number(usableFlopsPerCPU.toFixed(0)),
    cpusCompute: Number(cpusCompute.toFixed(2)),
    TPS_CPU: cpuTps,
    cpusDecode: Number(cpusDecode.toFixed(2)),
    M_prefill: cpuPrefillMultiplier,
    cpusWithPrefill: Number(cpusWithPrefill.toFixed(2)),
    U_target: cpuUtilizationTarget,
    cpusUtil: Number(cpusUtil.toFixed(2)),
    redundancy: cpuRedundancy,
    finalCPUs: Number(finalCPUs.toFixed(2)),
    finalCPUsRounded,
    deliveredTPS: Number(deliveredTPS.toFixed(1)),
    sanityPass,
    notes
  };

  return {
    unitsNeeded: finalCPUsRounded,
    throughputPerUnit: cpuTps * cpuUtilizationTarget,
    totalSystemThroughput: deliveredTPS,
    headroom,
    totalOverheadPercent: 0,
    overheadBreakdown: notes,
    cpuSizing
  };
}
