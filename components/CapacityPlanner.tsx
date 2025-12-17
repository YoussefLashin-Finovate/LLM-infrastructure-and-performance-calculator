'use client';
import { calculateModelSize } from '@/lib/calculationParameters';
import {
  MODEL_OPTIONS,
  QUANTIZATION_OPTIONS,
  CALCULATION_CONSTANTS,
  HELPER_TEXT,
  UI_CONFIG,
  INFO_CONTENT
} from '@/lib/config';
import { useHardwareGroups } from '@/hooks/useHardwareFilter';
import { hardwareDatabase } from '@/lib/hardwareDatabase';

// Safe number formatter - prevents NaN from being rendered
function safeNum(value: number | undefined, decimals: number = 1): string {
  if (value === undefined || isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  return value.toFixed(decimals);
}

// Get hardware type from hardware value string
function getHardwareType(hardwareValue: string): 'gpu' | 'cpu' {
  const hw = hardwareDatabase.find(h => h.value === hardwareValue);
  return hw?.type || 'gpu'; // default to gpu for backwards compatibility
}

// Get memory label based on hardware type
function getMemoryLabel(hardwareValue: string): string {
  return getHardwareType(hardwareValue) === 'cpu' ? 'System RAM' : 'VRAM';
}

// Format FLOPS to readable units
function formatFLOPS(flops: number): string {
  if (isNaN(flops) || !isFinite(flops)) return 'N/A FLOPS';
  if (flops >= 1e15) {
    return `${(flops / 1e15).toFixed(2)} PFLOPS`;
  } else if (flops >= 1e12) {
    return `${(flops / 1e12).toFixed(2)} TFLOPS`;
  } else if (flops >= 1e9) {
    return `${(flops / 1e9).toFixed(2)} GFLOPS`;
  } else {
    return `${flops.toFixed(2)} FLOPS`;
  }
}

async function exportToPDF(inputs: any, results: any) {
  try {
    const jsPDF = (await import('jspdf')).default;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPos = 20;
    const leftMargin = 20;
    const rightMargin = 190;
    const lineHeight = 7;

    const memoryLabel = getMemoryLabel(inputs.hardware);

    // Header
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, 210, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LLM Infrastructure Report', leftMargin, 20);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Capacity Planning Analysis', leftMargin, 30);
    pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), leftMargin, 36);

    yPos = 55;
    pdf.setTextColor(0, 0, 0);

    // Section: Your Inputs
    pdf.setFillColor(59, 130, 246);
    pdf.rect(leftMargin - 5, yPos - 5, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INPUT PARAMETERS', leftMargin, yPos);
    yPos += 12;

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    // Calculate effective model params
    const effectiveModelParams = inputs.model === 'custom' ? inputs.customTotalParamsReverse : parseFloat(inputs.model);

    const inputData = [
      ['Model Size:', `${effectiveModelParams.toFixed(1)}B parameters`],
      ['Quantization Type:', inputs.quantization.toUpperCase()],
      ['Hardware:', inputs.hardware.split('|')[0]],
      ['Utilization:', `${(inputs.utilization * 100).toFixed(0)}%`],
      ['Number of Users:', inputs.users.toString()],
      ['Tokens/sec per User:', inputs.tokensPerSec.toString()],
    ];

    if (inputs.useKVCache) {
      inputData.push(
        ['System Tokens:', `${inputs.systemPromptTokens} (cached)`],
        ['History Tokens:', `${inputs.sessionHistoryTokens} (cached)`],
        ['Input Tokens:', `${inputs.newInputTokens} (per request)`]
      );
    } else {
      inputData.push(['Output Length:', `${inputs.inputLength} tokens`]);
    }

    inputData.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, leftMargin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, leftMargin + 60, yPos);
      yPos += lineHeight;
    });

    yPos += 5;

    // Section: Computed Results
    pdf.setFillColor(16, 185, 129);
    pdf.rect(leftMargin - 5, yPos - 5, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPUTED RESULTS', leftMargin, yPos);
    yPos += 12;

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    const flopsPerToken = parseFloat(inputs.model) * 2e9; // 2× for inference (forward pass only)
    const totalTokensPerSec = inputs.users * inputs.tokensPerSec;
    const totalFlopsPerSec = totalTokensPerSec * flopsPerToken;

    const resultsData = [
      ['FLOPs per Parameter per Token:', '2.0 (inference)'],
      ['FLOPs per Token:', formatFLOPS(flopsPerToken)],
      ['Total Tokens/sec:', totalTokensPerSec.toFixed(1)],
      ['Total FLOPs/sec:', formatFLOPS(totalFlopsPerSec)],
      ['', ''],
      ['Hardware Units Needed:', results.unitsNeeded.toString()],
      ['Total System Throughput:', `${results.totalSystemThroughput.toFixed(1)} tokens/sec`],
      ['Throughput per Unit:', `${results.throughputPerUnit.toFixed(1)} tokens/sec`],
      ['System Headroom:', `${results.headroom.toFixed(0)}%`],
      [`Total ${memoryLabel}:`, `${results.totalVRAM.toFixed(0)} GB`],
      [`${memoryLabel} per Unit:`, `${results.vramPerUnit} GB`],
      ['Model Size:', `${results.modelSize.toFixed(1)} GB`],
    ];

    if (results.vramAllocation && results.vramAllocation.kvCacheGB > 0) {
      resultsData.push(['KV Cache Memory:', `${results.vramAllocation.kvCacheGB.toFixed(2)} GB`]);
      resultsData.push([`Total ${memoryLabel} per Unit:`, `${results.vramAllocation.totalUsedGB.toFixed(1)} GB`]);
    }

    if (results.vramAllocation && results.vramAllocation.offloadedMemoryGB !== undefined && results.vramAllocation.offloadedMemoryGB > 0) {
      const offloadedMem = results.vramAllocation.offloadedMemoryGB >= 1000
        ? `${(results.vramAllocation.offloadedMemoryGB / 1000).toFixed(2)} TB`
        : `${results.vramAllocation.offloadedMemoryGB.toFixed(1)} GB`;
      resultsData.push(['CPU/NVMe Memory (KV Offloading):', offloadedMem]);
    }

    resultsData.push(
      ['Total Overhead:', `${results.totalOverheadPercent.toFixed(0)}%`],
    );

    resultsData.forEach(([label, value]) => {
      if (label === '') {
        yPos += 3;
        return;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, leftMargin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, leftMargin + 70, yPos);
      yPos += lineHeight;
    });

    yPos += 5;

    // Section: Overhead Breakdown
    if (results.overheadBreakdown && results.overheadBreakdown.length > 0) {
      pdf.setFillColor(100, 116, 139);
      pdf.rect(leftMargin - 5, yPos - 5, 170, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OVERHEAD BREAKDOWN', leftMargin, yPos);
      yPos += 12;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      results.overheadBreakdown.forEach((overhead: string) => {
        pdf.text(`• ${overhead}`, leftMargin + 5, yPos);
        yPos += lineHeight;
      });
    }

    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Generated by LLM Infrastructure Calculator', leftMargin, 275);
    pdf.text(`Report ID: CAP-${Date.now()}`, leftMargin, 280);
    pdf.text('© 2025 Finovate Team. All rights reserved.', leftMargin, 285);

    pdf.save(`Infrastructure-Capacity-Report-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

interface CapacityPlannerProps {
  model: string;
  setModel: (value: string) => void;
  quantization: string;
  setQuantization: (value: string) => void;
  hardware: string;
  setHardware: (value: string) => void;
  users: number;
  setUsers: (value: number) => void;
  inputLength: number;
  setInputLength: (value: number) => void;
  tokensPerSec: number;
  setTokensPerSec: (value: number) => void;
  utilization: number;
  setUtilization: (value: number) => void;
  useKVCache: boolean;
  setUseKVCache: (value: boolean) => void;
  kvOffloading: boolean;
  setKvOffloading: (value: boolean) => void;
  kvOffloadingPercentage: number;
  setKvOffloadingPercentage: (value: number) => void;
  systemPromptTokens: number;
  setSystemPromptTokens: (value: number) => void;
  sessionHistoryTokens: number;
  setSessionHistoryTokens: (value: number) => void;
  newInputTokens: number;
  setNewInputTokens: (value: number) => void;
  useMoeArchitecture: boolean;
  setUseMoeArchitecture: (value: boolean) => void;
  useCustomModelReverse: boolean;
  setUseCustomModelReverse: (value: boolean) => void;
  customTotalParamsReverse: number;
  setCustomTotalParamsReverse: (value: number) => void;
  customActiveParamsReverse: number;
  setCustomActiveParamsReverse: (value: number) => void;
  customTotalExpertsReverse: number;
  setCustomTotalExpertsReverse: (value: number) => void;
  customActiveExpertsReverse: number;
  setCustomActiveExpertsReverse: (value: number) => void;
  // CPU/GPU mode and CPU-specific overrides
  calcMode: 'auto' | 'cpu' | 'gpu';
  setCalcMode: (mode: 'auto' | 'cpu' | 'gpu') => void;
  cpuTps: number;
  setCpuTps: (value: number) => void;
  cpuPrefillMultiplier: number;
  setCpuPrefillMultiplier: (value: number) => void;
  cpuUtilizationTarget: number;
  setCpuUtilizationTarget: (value: number) => void;
  cpuRedundancy: number;
  setCpuRedundancy: (value: number) => void;
  cpuAMXEfficiency: number;
  setCpuAMXEfficiency: (value: number) => void;
  cpuModelRamOverhead: number;
  setCpuModelRamOverhead: (value: number) => void;
  results: {
    unitsNeeded: number;
    throughputPerUnit: number;
    totalSystemThroughput: number;
    headroom: number;
    totalOverheadPercent: number;
    overheadBreakdown: string[];
    totalVRAM: number;
    totalFLOPS: number;
    modelSize: number;
    vramPerUnit: number;
    vramAllocation?: {
      modelWeightsGB: number;
      kvCacheGB: number;
      safetyBufferGB: number;
      totalUsedGB: number;
      availableGB: number;
      canFitModel: boolean;
      warnings: string[];
      offloadedMemoryGB?: number;
      offloadingPercentage?: number;
      kvCacheInVRAM?: number;
      kvCacheOffloaded?: number;
    };
    kvCache?: {
      totalSessionTokens: number;
      kvMemoryGB: number;
      maxSessionsPerGPU: number;
      kvUtilizationPercent: number;
    };
    batchingStrategy?: {
      maxBatchSizePerGPU: number;
      optimalBatchSize: number;
      numBatchesPerGPU: number;
      totalBatches: number;
      requestsPerBatch: number;
      kvCachePerBatch: number;
      latencyMs: number;
      throughputPerGPU: number;
      utilizationPercent: number;
      constraints: {
        vramLimited: boolean;
        computeLimited: boolean;
        latencyLimited: boolean;
      };
      recommendations: string[];
    };
    // CPU sizing results (when CPU path is used)
    cpuSizing?: {
      modelRamGB: number;
      fitsOnSingleNode?: boolean;
      flopsPerTokenGFLOPS: number;
      totalFlopsTFLOPS: number;
      usableFlopsPerCPU?: number;
      cpusCompute: number;
      TPS_CPU: number;
      cpusDecode: number;
      M_prefill: number;
      cpusWithPrefill: number;
      U_target: number;
      cpusUtil: number;
      redundancy: number;
      finalCPUs: number;
      finalCPUsRounded: number;
      deliveredTPS: number;
      sanityPass: boolean;
      notes?: string[];
    };
  };
}

export default function CapacityPlanner({
  model,
  setModel,
  quantization,
  setQuantization,
  hardware,
  setHardware,
  users,
  setUsers,
  inputLength,
  setInputLength,
  tokensPerSec,
  setTokensPerSec,
  utilization,
  setUtilization,
  useKVCache,
  setUseKVCache,
  kvOffloading,
  setKvOffloading,
  kvOffloadingPercentage,
  setKvOffloadingPercentage,
  systemPromptTokens,
  setSystemPromptTokens,
  sessionHistoryTokens,
  setSessionHistoryTokens,
  newInputTokens,
  setNewInputTokens,
  useMoeArchitecture,
  setUseMoeArchitecture,
  useCustomModelReverse,
  setUseCustomModelReverse,
  customTotalParamsReverse,
  setCustomTotalParamsReverse,
  customActiveParamsReverse,
  setCustomActiveParamsReverse,
  customTotalExpertsReverse,
  setCustomTotalExpertsReverse,
  customActiveExpertsReverse,
  setCustomActiveExpertsReverse,
  // CPU/GPU mode & CPU overrides
  calcMode,
  setCalcMode,
  cpuTps,
  setCpuTps,
  cpuPrefillMultiplier,
  setCpuPrefillMultiplier,
  cpuUtilizationTarget,
  setCpuUtilizationTarget,
  cpuRedundancy,
  setCpuRedundancy,
  cpuAMXEfficiency,
  setCpuAMXEfficiency,
  cpuModelRamOverhead,
  setCpuModelRamOverhead,
  results,
}: CapacityPlannerProps) {
  const hardwareGroups = useHardwareGroups(quantization);

  // Calculate effective model params for display
  const effectiveModelParams = (useCustomModelReverse || model === 'custom') ? customTotalParamsReverse : parseFloat(model);

  // Detect if CPU hardware is selected
  const selectedHW = hardwareDatabase.find(hw => hw.value === hardware);
  const isCPU = selectedHW?.type === 'cpu';

  // Debug log to check if vramAllocation exists
  if (typeof window !== 'undefined') {
    console.log('🔍 CapacityPlanner Results:', {
      hasVramAllocation: !!results.vramAllocation,
      hasKvCache: !!results.kvCache,
      vramAllocation: results.vramAllocation,
      kvCache: results.kvCache,
      useKVCache,
      isCPU,
      allResults: results
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* CPU Warning Banner */}
      {isCPU && (
        <div className="col-span-1 lg:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="text-3xl p-2 bg-white/50 rounded-lg backdrop-blur-sm shadow-sm">⚠️</div>
            <div className="flex-1">
              <h4 className="text-amber-900 text-lg font-bold mb-3">
                CPU-Based Inference Detected
              </h4>
              <div className="text-amber-800 text-sm leading-relaxed space-y-2">
                <p>
                  <strong>Reality Check:</strong> CPUs are heavily memory-bound for LLM inference.
                  Peak TOPS ratings do NOT translate to sustained throughput.
                </p>
                <div className="bg-white/40 p-3 rounded-lg border border-amber-100/50">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Realistic utilization: <strong>15-30%</strong> of peak TOPS (auto-applied)</li>
                    <li>Memory bandwidth is the primary bottleneck (DDR5: ~307 GB/s)</li>
                    <li>Best for: Small models (&lt;20B params), dev/testing, cost optimization</li>
                    <li>Production workloads &gt;20B params: <strong>Consider GPUs</strong></li>
                  </ul>
                </div>
                <p className="italic mt-2 text-amber-900/80 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  These calculations apply realistic CPU constraints. Unit counts may be significantly higher than GPU equivalents.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Panel */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 shadow-sm h-fit">
        <h3 className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent mb-6 pb-4 border-b border-slate-100">
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">⚙️</span> Requirements
        </h3>

        <div className="space-y-2 mb-6">
          <label className="block text-sm font-semibold text-slate-700">Compute Mode</label>
          <div className="flex gap-2 p-1 bg-slate-100/80 rounded-lg w-fit">
            <button
              onClick={() => setCalcMode('auto')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${calcMode === 'auto' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-none'}`}
            >
              Auto
            </button>
            <button
              onClick={() => setCalcMode('gpu')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${calcMode === 'gpu' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-none'}`}
            >
              GPU
            </button>
            <button
              onClick={() => setCalcMode('cpu')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${calcMode === 'cpu' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-none'}`}
            >
              CPU
            </button>
          </div>
          <p className="text-xs text-slate-500 pt-1">Choose CPU to force CPU-based sizing, GPU for GPU sizing, or Auto.</p>
        </div>

        <div className="space-y-2 mb-6">
          <label htmlFor="reverse_model" className="block text-sm font-semibold text-slate-700">Model Size</label>
          <div className="relative">
            <select
              id="reverse_model"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setUseCustomModelReverse(e.target.value === 'custom');
              }}
              className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none shadow-sm transition-all hover:border-indigo-300"
            >
              {MODEL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>
          <p className="text-xs text-slate-500">{model !== 'custom' && HELPER_TEXT.modelSize(calculateModelSize(parseFloat(model), quantization))}</p>
        </div>

        {/* Custom Model Configuration */}
        {useCustomModelReverse && (
          <div className="bg-emerald-50/50 rounded-lg p-5 border border-emerald-200 mb-6">
            <h4 className="text-emerald-900 font-bold mb-4 flex items-center gap-2">
              🎨 Custom Model Configuration
            </h4>

            <div className="space-y-2 mb-4">
              <label htmlFor="custom_total_params_reverse" className="block text-sm font-medium text-emerald-800">Total Parameters (Billions)</label>
              <input
                type="number"
                id="custom_total_params_reverse"
                value={customTotalParamsReverse}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCustomTotalParamsReverse(isNaN(val) ? 1 : val);
                  // Auto-set active params to match total for dense models
                  if (!useMoeArchitecture) {
                    setCustomActiveParamsReverse(isNaN(val) ? 1 : val);
                  }
                }}
                min={0.1}
                step={0.1}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-emerald-700">Total model parameters including all experts (if MoE)</p>
            </div>

            <div className="space-y-2 mb-4">
              <label htmlFor="custom_active_params_reverse" className="block text-sm font-medium text-emerald-800">Active Parameters (Billions)</label>
              <input
                type="number"
                id="custom_active_params_reverse"
                value={customActiveParamsReverse}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCustomActiveParamsReverse(isNaN(val) ? 1 : val);
                }}
                min={0.1}
                step={0.1}
                disabled={!useMoeArchitecture}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-slate-50"
              />
              <p className="text-xs text-emerald-700">Parameters used per token {!useMoeArchitecture && '(same as total for dense models)'}</p>
            </div>

            {useMoeArchitecture && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <label htmlFor="custom_total_experts_reverse" className="block text-sm font-medium text-emerald-800">Total Experts</label>
                    <input
                      type="number"
                      id="custom_total_experts_reverse"
                      value={customTotalExpertsReverse}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setCustomTotalExpertsReverse(isNaN(val) ? 1 : val);
                      }}
                      min={1}
                      step={1}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="custom_active_experts_reverse" className="block text-sm font-medium text-emerald-800">Active Experts</label>
                    <input
                      type="number"
                      id="custom_active_experts_reverse"
                      value={customActiveExpertsReverse}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setCustomActiveExpertsReverse(isNaN(val) ? 1 : val);
                      }}
                      min={1}
                      step={1}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="bg-emerald-100/50 p-4 rounded-lg mt-4 text-sm text-emerald-900 border border-emerald-200">
                  <strong className="block mb-2 text-emerald-800">📊 Configuration Summary:</strong>
                  <ul className="list-disc pl-5 space-y-1 text-emerald-700">
                    <li>Total: {customTotalParamsReverse}B params → VRAM: {(customTotalParamsReverse * (quantization === 'fp16' ? 2 : quantization === 'int8' ? 1 : 0.5)).toFixed(1)}GB</li>
                    <li>Active: {customActiveParamsReverse}B params ({((customActiveParamsReverse / customTotalParamsReverse) * 100).toFixed(1)}% of total)</li>
                    <li>Experts: {customActiveExpertsReverse}/{customTotalExpertsReverse} active ({((customActiveExpertsReverse / customTotalExpertsReverse) * 100).toFixed(1)}%)</li>
                    <li>Compute reduction: {((1 - customActiveParamsReverse / customTotalParamsReverse) * 100).toFixed(1)}%</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100 mb-6">
          <label className="flex items-center gap-3 cursor-pointer font-bold text-indigo-900">
            <input
              type="checkbox"
              checked={useMoeArchitecture}
              onChange={(e) => setUseMoeArchitecture(e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
            />
            <span>Enable MoE Architecture</span>
          </label>
          <p className="mt-2 ml-8 text-xs text-indigo-700 font-medium">
            Use Mixture-of-Experts architecture calculations (affects compute and memory usage)
          </p>
        </div>

        <div className="space-y-2 mb-6">
          <label htmlFor="reverse_quantization" className="block text-sm font-semibold text-slate-700">Quantization Level</label>
          <select
            id="reverse_quantization"
            value={quantization}
            onChange={(e) => setQuantization(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {QUANTIZATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.name}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500">{HELPER_TEXT.quantizationNote}</p>
        </div>

        <div className="space-y-2 mb-6">
          <label htmlFor="reverse_users" className="block text-sm font-semibold text-slate-700">Required Concurrent Users</label>
          <input
            type="number"
            id="reverse_users"
            value={users}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setUsers(isNaN(val) ? 1 : val);
            }}
            step={CALCULATION_CONSTANTS.steps.users}
            min="1"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-slate-500">{HELPER_TEXT.usersNote}</p>
        </div>

        <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-100 mb-6">
          <label className="flex items-center gap-3 cursor-pointer font-bold text-emerald-900">
            <input
              type="checkbox"
              checked={useKVCache}
              onChange={(e) => setUseKVCache(e.target.checked)}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
            />
            <span>Enable KV Cache Mode (Token-Aware)</span>
          </label>
          <p className="mt-2 ml-8 text-xs text-emerald-700 font-medium">
            Split tokens into per-session (cached) and per-request (new) for accurate compute modeling
          </p>

          {isCPU && (
            <div className="mt-3 p-3 bg-blue-50/80 rounded-lg text-xs text-blue-800 border border-blue-200 flex gap-2 items-start">
              <span>ℹ️</span> <strong>Note:</strong> KV cache offloading is not available for CPU-only inference.
              CPUs already use system RAM for all operations (model weights + KV cache).
            </div>
          )}
        </div>

        {useKVCache && !isCPU && (
          <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 mb-6 -mt-4">
            <label className="flex items-center gap-3 cursor-pointer font-bold text-blue-900">
              <input
                type="checkbox"
                checked={kvOffloading}
                onChange={(e) => setKvOffloading(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              <span>Enable KV Cache Offloading (CPU/NVMe)</span>
            </label>
            <p className="mt-2 ml-8 text-xs text-blue-700 font-medium whitespace-pre-line">
              {kvOffloading
                ? '✓ GPU count optimized with KV cache offloading'
                : '✗ GPU count based on VRAM (model + KV cache must fit in GPU memory)'}
            </p>

            {kvOffloading && (
              <div className="mt-4 ml-8 pl-4 border-l-2 border-blue-200">
                <label htmlFor="offloading_percentage" className="text-sm font-semibold text-blue-900 block mb-2">
                  Offloading Percentage: {kvOffloadingPercentage}%
                </label>
                <input
                  id="offloading_percentage"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={kvOffloadingPercentage}
                  onChange={(e) => setKvOffloadingPercentage(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0% (All in VRAM)</span>
                  <span>50% (Balanced)</span>
                  <span>100% (All offloaded)</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  {kvOffloadingPercentage === 0 && '💾 All KV cache in GPU VRAM (high performance, high VRAM usage)'}
                  {kvOffloadingPercentage > 0 && kvOffloadingPercentage < 50 && '⚡ Mostly in VRAM (good performance, moderate offloading)'}
                  {kvOffloadingPercentage >= 50 && kvOffloadingPercentage < 100 && '⚖️ Balanced split (reduces GPU memory, some CPU overhead)'}
                  {kvOffloadingPercentage === 100 && '🔄 Fully offloaded (minimal VRAM, compute-based GPU count)'}
                </p>
              </div>
            )}
          </div>
        )}

        {!useKVCache ? (
          <div className="space-y-2 mb-6">
            <label htmlFor="reverse_input" className="block text-sm font-semibold text-slate-700">Avg Input Length (tokens)</label>
            <input
              type="number"
              id="reverse_input"
              value={inputLength}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setInputLength(isNaN(val) ? 1 : val);
              }}
              step={CALCULATION_CONSTANTS.steps.inputLength}
              min="1"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-slate-500">{HELPER_TEXT.inputLengthNote}</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6 pl-4 border-l-2 border-slate-200">
            <div className="space-y-2">
              <label htmlFor="reverse_system_prompt" className="block text-sm font-semibold text-slate-700">System Prompt (tokens) - Per Session</label>
              <input
                type="number"
                id="reverse_system_prompt"
                value={systemPromptTokens}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setSystemPromptTokens(Math.min(Math.max(val, 0), 100000));
                }}
                step="100"
                min="0"
                max="100000"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500">Cached once per session (e.g., instructions, RAG context)</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="reverse_history" className="block text-sm font-semibold text-slate-700">Session History (tokens) - Per Session</label>
              <input
                type="number"
                id="reverse_history"
                value={sessionHistoryTokens}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setSessionHistoryTokens(Math.min(Math.max(val, 0), 200000));
                }}
                step="100"
                min="0"
                max="200000"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500">Conversation history cached in session (grows over time)</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="reverse_new_input" className="block text-sm font-semibold text-slate-700">New Input (tokens) - Per Request</label>
              <input
                type="number"
                id="reverse_new_input"
                value={newInputTokens}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setNewInputTokens(Math.min(Math.max(val, 1), 100000));
                }}
                step="50"
                min="1"
                max="100000"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500">User's new input requiring prefill compute every request</p>
            </div>
          </div>
        )}

        <div className="space-y-2 mb-6">
          <label htmlFor="reverse_tokens" className="block text-sm font-semibold text-slate-700">Output Tokens/sec per User</label>
          <input
            type="number"
            id="reverse_tokens"
            value={tokensPerSec}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setTokensPerSec(isNaN(val) ? 0.1 : val);
            }}
            step={CALCULATION_CONSTANTS.steps.tokensPerSec}
            min="0.1"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-slate-500">{HELPER_TEXT.outputRateNote}</p>
        </div>

        {calcMode === 'cpu' && (
          <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100 mb-6">
            <h4 className="text-blue-900 font-bold mb-3">CPU Configuration (overrides)</h4>
            <div className="space-y-2 mb-4">
              <label htmlFor="cpu_tps" className="block text-sm font-medium text-blue-800">TPS per CPU (decode)</label>
              <input id="cpu_tps" type="number" value={cpuTps} onChange={(e) => setCpuTps(parseFloat(e.target.value) || 0)} step={1} min={1} className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-blue-700">Empirical tokens/sec per CPU (default: 8)</p>
            </div>
            <div className="space-y-2 mb-4">
              <label htmlFor="cpu_prefill" className="block text-sm font-medium text-blue-800">Prefill multiplier (M_prefill)</label>
              <input id="cpu_prefill" type="number" value={cpuPrefillMultiplier} onChange={(e) => setCpuPrefillMultiplier(parseFloat(e.target.value) || 1)} step={0.1} min={1} className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-blue-700">Long-context prefill cost multiplier (default: 2.5)</p>
            </div>
            <div className="space-y-2 mb-4">
              <label htmlFor="cpu_util" className="block text-sm font-medium text-blue-800">Target utilization (U_target)</label>
              <input id="cpu_util" type="number" value={cpuUtilizationTarget} onChange={(e) => setCpuUtilizationTarget(parseFloat(e.target.value) || 0.1)} step={0.01} min={0.1} max={1} className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-blue-700">Typical sustained utilization (default: 0.65)</p>
            </div>
            <div className="space-y-2 mb-4">
              <label htmlFor="cpu_redundancy" className="block text-sm font-medium text-blue-800">Redundancy multiplier</label>
              <input id="cpu_redundancy" type="number" value={cpuRedundancy} onChange={(e) => setCpuRedundancy(parseFloat(e.target.value) || 1)} step={0.01} min={1} className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-blue-700">N+1 redundancy factor (default: 1.15)</p>
            </div>
            <div className="space-y-2 mb-4">
              <label htmlFor="cpu_amx" className="block text-sm font-medium text-blue-800">AMX sustained efficiency</label>
              <input id="cpu_amx" type="number" value={cpuAMXEfficiency} onChange={(e) => setCpuAMXEfficiency(parseFloat(e.target.value) || 0.15)} step={0.01} min={0} max={1} className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-blue-700">Sustained AMX efficiency to use instead of peak (0.15-0.25 recommended)</p>
            </div>
            <div className="space-y-2 mb-4">
              <label htmlFor="cpu_model_overhead" className="block text-sm font-medium text-blue-800">Model RAM overhead</label>
              <input id="cpu_model_overhead" type="number" value={cpuModelRamOverhead} onChange={(e) => setCpuModelRamOverhead(parseFloat(e.target.value) || 1)} step={0.01} min={1} className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-blue-700">Memory overhead for embeddings/scales/buffers (default: 1.2)</p>
            </div>
          </div>
        )}

        <div className="space-y-2 mb-6">
          <label htmlFor="reverse_hardware" className="block text-sm font-semibold text-slate-700">Target Hardware</label>
          <select
            id="reverse_hardware"
            value={hardware}
            onChange={(e) => setHardware(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {hardwareGroups.map((group: any) => (
              <optgroup key={group.family} label={group.family}>
                {group.options.map((hw: any, idx: number) => {
                  const memDisplay = hw.type === 'cpu'
                    ? `(Max: ${hw.memory >= 1000 ? (hw.memory / 1000).toFixed(1) + 'TB' : hw.memory + 'GB'} DDR5)`
                    : `- ${hw.memory}GB VRAM`;
                  return (
                    <option key={idx} value={hw.value}>
                      {hw.name} {memDisplay}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
          <p className="text-xs text-slate-500">All hardware options available ({hardwareGroups.reduce((acc: number, g: any) => acc + g.options.length, 0)} total)</p>
        </div>

        <div className="space-y-2 mb-6">
          <label htmlFor="reverse_util" className="block text-sm font-semibold text-slate-700">Utilization Factor</label>
          <input
            type="number"
            id="reverse_util"
            value={utilization}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setUtilization(isNaN(val) ? 0.1 : val);
            }}
            step={CALCULATION_CONSTANTS.steps.utilization}
            min={CALCULATION_CONSTANTS.utilizationMin}
            max={CALCULATION_CONSTANTS.utilizationMax}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-slate-500">{HELPER_TEXT.utilizationTypical}</p>
        </div>
      </div>

      {/* Results Panel */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 h-fit sticky top-6">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h3 className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            <span className="text-2xl">📊</span> Capacity Analysis
          </h3>
          <button
            onClick={() => exportToPDF({
              model, quantization, hardware, users, inputLength, tokensPerSec, utilization,
              useKVCache, systemPromptTokens, sessionHistoryTokens, newInputTokens
            }, results)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Export Report
          </button>
        </div>

        {results.unitsNeeded > 0 ? (
          <div className="space-y-4">
            {/* Primary Result Card */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-60 -mr-6 -mt-6 pointer-events-none"></div>
              <div className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wide relative z-10">Hardware Units Needed</div>
              <div className="text-4xl font-extrabold text-slate-900 mb-2 relative z-10">{results.unitsNeeded} <span className="text-lg font-normal text-slate-600">x {selectedHW?.name || 'Units'}</span></div>
              <div className="text-xs text-slate-600 font-medium bg-white/80 p-2 rounded-lg border border-slate-200 inline-block backdrop-blur-sm relative z-10">
                System Throughput: <span className="font-bold text-emerald-600">{safeNum(results.totalSystemThroughput, 1)}</span> tokens/sec total
              </div>
            </div>

            {/* Throughput & Headroom Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                <div className="text-xs text-blue-700 font-semibold uppercase mb-1">Per Unit T/s</div>
                <div className="text-xl font-bold text-blue-900">{safeNum(results.throughputPerUnit, 1)}</div>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
                <div className="text-xs text-indigo-700 font-semibold uppercase mb-1">Headroom</div>
                <div className="text-xl font-bold text-indigo-900">{safeNum(results.headroom, 0)}%</div>
              </div>
            </div>

            {/* Key Metrics List */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
              <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                <span>📉</span> Key Metrics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Number of Users</span>
                  <span className="font-semibold text-slate-900">{users}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Tokens/sec/User</span>
                  <span className="font-semibold text-slate-900">{tokensPerSec}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Quantization</span>
                  <span className="font-semibold text-slate-900">{quantization.toUpperCase()}</span>
                </div>
                {useKVCache && (
                  <>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">System Tokens</span>
                      <span className="font-semibold text-slate-900">{systemPromptTokens}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Context/History</span>
                      <span className="font-semibold text-slate-900">{sessionHistoryTokens}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Internally Computed Values */}
            <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100">
              <h4 className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2">
                <span>🧠</span> Internally Computed Values
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-emerald-100/50 pb-1">
                  <span className="text-slate-500">Model Size</span>
                  <span className="font-mono text-emerald-700 font-semibold">{results.modelSize.toFixed(1)} GB</span>
                </div>

                {useKVCache && results.vramAllocation && (
                  <>
                    <div className="flex justify-between border-b border-emerald-100/50 pb-1">
                      <span className="text-slate-500">KV Memory/Session</span>
                      <span className="font-mono text-emerald-700 font-semibold">{results.vramAllocation.kvCacheGB.toFixed(2)} GB</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-100/50 pb-1">
                      <span className="text-slate-500">Total {getMemoryLabel(hardware)}/Unit</span>
                      <span className="font-mono text-emerald-700 font-bold">{(results.modelSize + (results.vramAllocation.kvCacheGB * users) + results.vramAllocation.safetyBufferGB).toFixed(1)} GB</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between border-b border-emerald-100/50 pb-1">
                  <span className="text-slate-500">FLOPs/Token</span>
                  <span className="font-mono text-emerald-700">{formatFLOPS(effectiveModelParams * 2e9)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Total System FLOPs</span>
                  <span className="font-mono text-emerald-700">{formatFLOPS((users * tokensPerSec) * effectiveModelParams * 2e9)}</span>
                </div>
              </div>
            </div>

            {/* Offloaded Memory Section */}
            {results.vramAllocation && results.vramAllocation.offloadedMemoryGB !== undefined && results.vramAllocation.offloadedMemoryGB > 0 && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h4 className="font-bold text-amber-900 text-sm mb-2 opacity-90">
                  {results.vramAllocation.offloadingPercentage === 100 ? 'System Memory Required' : `Partial Offloading (${results.vramAllocation.offloadingPercentage}%)`}
                </h4>
                <div className="flex justify-between items-end">
                  <span className="text-xs text-amber-800">CPU RAM / NVMe</span>
                  <span className="text-xl font-bold text-amber-900">{results.vramAllocation.offloadedMemoryGB.toFixed(1)} GB</span>
                </div>
                <div className="mt-2 text-xs text-amber-700 italic border-t border-amber-200 pt-2">
                  Ensure host system has at least {(results.vramAllocation.offloadedMemoryGB * 1.2).toFixed(1)} GB available RAM
                </div>
              </div>
            )}

            {/* Batching Strategy */}
            {results.batchingStrategy && (
              <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                <h4 className="font-bold text-indigo-900 text-sm mb-3 flex items-center gap-2">
                  <span>🔄</span> Batching Strategy
                </h4>
                <div className="space-y-2 text-xs text-indigo-800">
                  <div className="flex justify-between border-b border-indigo-100 pb-1">
                    <span className="text-indigo-700">Batch Size/GPU</span>
                    <span className="font-semibold text-indigo-900">{results.batchingStrategy.requestsPerBatch}</span>
                  </div>
                  <div className="flex justify-between border-b border-indigo-100 pb-1">
                    <span className="text-indigo-700">Max Batch (VRAM)</span>
                    <span className="font-semibold text-indigo-900">{results.batchingStrategy.maxBatchSizePerGPU}</span>
                  </div>
                  <div className="flex justify-between border-b border-indigo-100 pb-1">
                    <span className="text-indigo-700">Latency</span>
                    <span className="font-semibold text-indigo-900">{results.batchingStrategy.latencyMs.toFixed(0)} ms</span>
                  </div>
                  <div className="flex justify-between border-b border-indigo-100 pb-1">
                    <span className="text-indigo-700">Throughput/GPU</span>
                    <span className="font-semibold text-indigo-900">{results.batchingStrategy.throughputPerGPU.toFixed(1)} t/s</span>
                  </div>

                  {/* Constraints */}
                  <div className="mt-2 pt-2 border-t border-indigo-200">
                    <div className="font-semibold text-indigo-800 mb-1">Constraints:</div>
                    <div className="flex flex-col gap-1">
                      {results.batchingStrategy.constraints.vramLimited && <span className="text-red-600 font-medium">⚠️ VRAM Limited</span>}
                      {results.batchingStrategy.constraints.computeLimited && <span className="text-blue-600 font-medium">💻 Compute Limited</span>}
                      {results.batchingStrategy.constraints.latencyLimited && <span className="text-amber-600 font-medium">⏱️ Latency Limited</span>}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {results.batchingStrategy.recommendations.length > 0 && (
                    <div className="mt-2 text-indigo-600 italic bg-white/50 p-2 rounded">
                      <ul className="list-disc pl-3">
                        {results.batchingStrategy.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CPU Detailed Sizing */}
            {isCPU && results.cpuSizing && (
              <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
                <h4 className="font-bold text-sky-900 text-sm mb-3">CPU Sizing Logic</h4>
                <div className="space-y-1 text-xs text-sky-800 font-mono">
                  <div className="flex justify-between">
                    <span>Model RAM:</span>
                    <span>{results.cpuSizing.modelRamGB} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Final CPUs:</span>
                    <span>{results.cpuSizing.finalCPUsRounded}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-sky-200 pt-1 mt-1">
                    <span>Delivered TPS:</span>
                    <span>{results.cpuSizing.deliveredTPS} t/s</span>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-slate-400 mt-4 italic text-center">
              <strong>{INFO_CONTENT.productionPlanning}</strong>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="text-4xl mb-4 opacity-50">📉</div>
            <p className="text-sm font-medium">Configure parameters to see analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
