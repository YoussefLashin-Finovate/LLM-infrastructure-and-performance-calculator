'use client';
import { calculateModelSize, calculateFlopsMultiplier } from '@/lib/calculationParameters';
import { parseHardwareOpsFromValue } from '@/lib/equations/hardware';
import { formatFLOPS } from '@/lib/equations/format';
import {
  MODEL_OPTIONS,
  QUANTIZATION_OPTIONS,
  CALCULATION_CONSTANTS,
  HELPER_TEXT,
  UI_CONFIG,
  INFO_CONTENT
} from '@/lib/config';
import { useHardwareGroups } from '@/hooks/useHardwareFilter';
import QuantizationSelect from '@/components/QuantizationSelect';
import { hardwareDatabase } from '@/lib/hardwareDatabase';
import { GpuSelector, CpuSelector, TokenConfiguration } from '@/components/shared';
import CpuResults from '@/components/capacity/CpuResults';

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
    const pageHeight = 280; // Leave room for footer

    // Function to check if we need a new page
    const checkPageBreak = () => {
      if (yPos > pageHeight - 20) {
        pdf.addPage();
        yPos = 20;
        // Re-add header on new page
        pdf.setFillColor(16, 185, 129);
        pdf.rect(0, 0, 210, 40, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('LLM Infrastructure Report', leftMargin, 20);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Capacity Planning Analysis (continued)', leftMargin, 30);
        pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), leftMargin, 36);
        yPos = 55;
        pdf.setTextColor(0, 0, 0);
      }
    };

    const memoryLabel = getMemoryLabel(inputs.hardware);

    // Header with Logo
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, 210, 40, 'F');

    // Add logo
    try {
      const logoResponse = await fetch('/finovate-logo.png');
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        const logoData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });

        // Get image dimensions to maintain aspect ratio
        const img = new Image();
        img.src = logoData as string;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const aspectRatio = img.width / img.height;
        const logoHeight = 25; // Fixed height in mm
        const logoWidth = logoHeight * aspectRatio;

        // Add logo to the right side of header, maintaining aspect ratio
        pdf.addImage(logoData as string, 'PNG', 210 - logoWidth - 10, 7.5, logoWidth, logoHeight);
      }
    } catch (logoError) {
      console.warn('Could not load logo for PDF:', logoError);
    }

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LLM Infrastructure Report', leftMargin, 20);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(inputs.calcMode === 'cpu' ? 'CPU Capacity Planning Analysis' : 'GPU Capacity Planning Analysis', leftMargin, 30);
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

    // Get hardware info for proper display
    const selectedHW = hardwareDatabase.find(hw => hw.value === inputs.hardware);
    const hardwareName = selectedHW?.name || inputs.hardware.split('|')[0];

    if (inputs.calcMode === 'cpu') {
      // CPU Mode Inputs
      const cpuInputsData = [
        ['Calculation Mode:', 'CPU Mode'],
        ['Number of Users:', inputs.users?.toString() || 'N/A'],
        ['Tokens/sec per User:', inputs.tokensPerSec?.toString() || 'N/A'],
        ['Model Parameters (Billions):', effectiveModelParams?.toString() || 'N/A'],
        ['Quantization Level:', inputs.quantization?.toUpperCase() || 'N/A'],
        ['CPU Hardware:', hardwareName],
        ['Computed TPS per CPU:', (results.cpuSizing && results.cpuSizing.targetTPSPerCPU) ? results.cpuSizing.targetTPSPerCPU.toFixed(6) : 'N/A'],
        ['Prefill Multiplier:', inputs.cpuPrefillMultiplier?.toString() || 'N/A'],
        ['Utilization Target (%):', inputs.cpuUtilizationTarget ? (inputs.cpuUtilizationTarget * 100).toFixed(0) : 'N/A'],
        ['Redundancy Factor (%):', inputs.cpuRedundancy ? (inputs.cpuRedundancy * 100).toFixed(0) : 'N/A'],
        ['AMX Efficiency (%):', inputs.cpuAMXEfficiency ? (inputs.cpuAMXEfficiency * 100).toFixed(0) : 'N/A'],
        ['Model RAM Overhead (%):', inputs.cpuModelRamOverhead ? (inputs.cpuModelRamOverhead * 100).toFixed(0) : 'N/A'],
        ['System Prompt Tokens:', inputs.systemPromptTokens?.toString() || 'N/A'],
        ['Session History Tokens:', inputs.sessionHistoryTokens?.toString() || 'N/A'],
        ['New Input Tokens (per req):', inputs.newInputTokens?.toString() || 'N/A'],
        ['Active KV Users (%):', inputs.activeKvFraction ? (inputs.activeKvFraction * 100).toFixed(1) : (100).toString()]
      ];

      cpuInputsData.forEach(([label, value]) => {
        pdf.text(`${label} ${value}`, leftMargin, yPos);
        yPos += lineHeight;
        checkPageBreak();
      });

      yPos += 5;

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CPU SIZING RESULTS', leftMargin, yPos);
      yPos += 12;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      if (results.cpuSizing) {
        const activeKvPercent = (results.cpuSizing && results.cpuSizing.kvTotalGB && results.cpuSizing.kvTotalGB > 0)
          ? ((Number(results.cpuSizing.kvActiveGB || 0) / Number(results.cpuSizing.kvTotalGB || 1)) * 100)
          : (inputs.activeKvFraction ? (inputs.activeKvFraction * 100) : undefined);

        const cpuResultsData = [
          ['Model RAM Required:', `${results.cpuSizing.modelRamGB?.toFixed(1) || 'N/A'} GB`],
          ['KV Cache (worst-case, total):', `${results.cpuSizing.kvTotalGB?.toFixed(2) || '0.00'} GB`],
          ['Effective KV (active):', `${results.cpuSizing.kvActiveGB?.toFixed(2) || '0.00'} GB`],
          ['Effective KV (% active):', `${activeKvPercent !== undefined ? activeKvPercent.toFixed(1) + '%' : 'N/A'}`],
          ['KV Offloaded To:', 'System RAM (100%)'],
          ['Total Memory (Model + Effective KV):', `${results.cpuSizing.totalMemoryGB?.toFixed(2) || 'N/A'} GB`],
          ['Memory Per CPU:', `${results.cpuSizing.memoryPerCPU?.toFixed(2) || 'N/A'} GB`],
          ['FLOPs per Token:', formatFLOPS(results.cpuSizing.flopsPerTokenGFLOPS * 1e9)],
          ['Total FLOPs:', formatFLOPS(results.cpuSizing.totalFlopsTFLOPS * 1e12)],
          ['Computed TPS / CPU:', results.cpuSizing.targetTPSPerCPU?.toFixed(6) || 'N/A'],
          ['Compute CPUs (formula):', results.cpuSizing.cpusCompute?.toString() || 'N/A'],
          ['Decode CPUs (empirical):', results.cpuSizing.cpusDecode?.toString() || 'N/A'],
          ['Prefill CPUs:', results.cpuSizing.cpusWithPrefill?.toString() || 'N/A'],
          // Removed 'Utilization CPUs' and 'Redundancy CPUs' fields to avoid double-counting and dimensional confusion; redundancy is applied multiplicatively in the CPU sizing algorithm.
          ['Final CPUs:', results.cpuSizing.finalCPUsRounded?.toString() || 'N/A'],
          ['Delivered TPS:', results.cpuSizing.deliveredTPS?.toFixed(1) || 'N/A'],
        ];

        cpuResultsData.forEach(([label, value]) => {
          pdf.text(`${label} ${value}`, leftMargin, yPos);
          yPos += lineHeight;
          checkPageBreak();
        });
      }

    } else {
      // GPU Mode (Production-Grade) Inputs

      let inputData: [string, string][];

      if (inputs.useProductionFramework) {
        // Production-grade framework inputs
        inputData = [
          ['Framework:', 'Production-Grade'],
          ['Model Size:', `${effectiveModelParams.toFixed(1)}B parameters`],
          ['Quantization Type:', inputs.quantization.toUpperCase()],
          ['Hardware:', hardwareName],
          ['Number of Users:', inputs.numUsers?.toString() || 'N/A'],
          ['Tokens/sec per User:', inputs.tokensPerSecPerUser?.toString() || 'N/A'],
          ['Peak FLOPs:', formatFLOPS(inputs.peakFlops || 0)],
          ['VRAM per GPU:', `${inputs.vramPerGpu || 0} GB`],
          ['Kernel Efficiency:', `${((inputs.kernelEfficiency || 0) * 100).toFixed(0)} %`],
          ['Utilization Factor:', `${((inputs.utilizationFactor || 0) * 100).toFixed(0)} %`],
          ['Attention Overhead:', `${((inputs.attentionOverhead || 0) * 100).toFixed(0)} %`],
          ['Prefill Overhead:', `${((inputs.prefillOverhead || 0) * 100).toFixed(0)} %`],
          ['Target Headroom:', `${((inputs.targetHeadroom || 0) * 100).toFixed(0)} %`],
        ];

        if (inputs.systemPromptTokensPG) {
          inputData.push(['System Prompt Tokens:', inputs.systemPromptTokensPG.toString()]);
        }
        if (inputs.sessionHistoryTokensPG) {
          inputData.push(['Session History Tokens:', inputs.sessionHistoryTokensPG.toString()]);
        }
        if (inputs.newInputTokens) {
          inputData.push(['New Input Tokens per Request:', inputs.newInputTokens.toString()]);
        }
        if (inputs.offloadRatio && inputs.offloadRatio > 0) {
          inputData.push(['KV Cache Offload Ratio:', `${(inputs.offloadRatio * 100).toFixed(0)} %`]);
        }
      } else {
        // Legacy framework inputs
        inputData = [
          ['Framework:', 'Legacy'],
          ['Model Size:', `${effectiveModelParams.toFixed(1)}B parameters`],
          ['Quantization Type:', inputs.quantization.toUpperCase()],
          ['Hardware:', hardwareName],
          ['Utilization:', `${(inputs.utilization * 100).toFixed(0)} %`],
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
      }

      inputData.forEach(([label, value]) => {
        checkPageBreak();
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, leftMargin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, leftMargin + 80, yPos);
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

      // Use computed values from results instead of manual calculations
      const totalTokensPerSec = results.totalSystemThroughput || 0;
      const totalFlopsPerSec = results.requiredFLOPS || 0;

      // Calculate actual FLOP multiplier based on model size
      const flopsMultiplier = calculateFlopsMultiplier(effectiveModelParams);

      // Breakdown (if available)
      const decodePF = results.decodeFlopsPFLOPS || 0;
      const prefillPF = results.prefillFlopsPFLOPS || 0;
      const totalPF = results.totalWorkloadPFLOPS || (decodePF + prefillPF);

      const resultsData = [
        ['FLOPs per Parameter per Token:', `${flopsMultiplier.toFixed(1)}× (inference)`],
        ['Required FLOPs/sec (workload only - model/algorithm overheads):', formatFLOPS(totalFlopsPerSec)],
        ['  • Decode FLOPs/sec:', `${formatFLOPS(decodePF * 1e15)} (${(decodePF / Math.max(1, totalPF) * 100).toFixed(1)}%)`],
        ['  • Prefill FLOPs/sec:', `${formatFLOPS(prefillPF * 1e15)} (${(prefillPF / Math.max(1, totalPF) * 100).toFixed(1)}%)`],
        ['Total Tokens/sec:', totalTokensPerSec.toFixed(1)],
        ['Available System FLOPs/sec (capacity):', formatFLOPS(results.totalFLOPS || 0)],
        ['', ''],
        ['Hardware Units Needed:', results.unitsNeeded.toString()],
        ['Total System Throughput:', `${results.totalSystemThroughput.toFixed(1)} tokens/sec`],
        ['Throughput per Unit:', `${results.throughputPerUnit.toFixed(1)} tokens/sec`],
        ['System Headroom:', `${results.headroom.toFixed(0)} %`],
        [`Total ${memoryLabel}:`, `${results.totalVRAM.toFixed(0)} GB`],
        [`${memoryLabel} per Unit:`, `${results.vramPerUnit} GB`],
        ['Model Size:', `${results.modelSize.toFixed(1)} GB`],
      ];

      if (results.vramAllocation && results.vramAllocation.kvCacheGB > 0) {
        resultsData.push(['KV Cache Memory:', `${results.vramAllocation.kvCacheGB.toFixed(2)} GB`]);
        resultsData.push([`Total ${memoryLabel} per Unit:`, `${results.vramAllocation.totalUsedGB.toFixed(1)} GB`]);
      }

      // Add detailed KV cache and data information
      if (results.kvCache) {
        resultsData.push(['', '']);
        resultsData.push(['=== KV CACHE DETAILS ===', '']);
        resultsData.push(['Total Session Tokens:', results.kvCache.totalSessionTokens.toString()]);
        resultsData.push(['KV Memory per Session:', `${results.kvCache.kvMemoryGB.toFixed(3)} GB`]);
        resultsData.push(['Max Sessions per GPU:', results.kvCache.maxSessionsPerGPU === Infinity ? 'Unlimited (with offloading)' : results.kvCache.maxSessionsPerGPU.toString()]);
        resultsData.push(['KV Cache Utilization:', `${results.kvCache.kvUtilizationPercent.toFixed(1)} %`]);
      }

      if (results.vramAllocation) {
        resultsData.push(['', '']);
        resultsData.push(['=== VRAM ALLOCATION ===', '']);
        resultsData.push(['Model Weights:', `${results.vramAllocation.modelWeightsGB.toFixed(1)} GB`]);
        resultsData.push(['KV Cache (per user):', `${results.vramAllocation.kvCacheGB.toFixed(3)} GB`]);
        resultsData.push(['Safety Buffer:', `${results.vramAllocation.safetyBufferGB.toFixed(1)} GB`]);
        resultsData.push(['Total Used VRAM:', `${results.vramAllocation.totalUsedGB.toFixed(1)} GB`]);
        resultsData.push(['Available VRAM:', `${results.vramAllocation.availableGB.toFixed(1)} GB`]);
        resultsData.push(['VRAM Fit Status:', results.vramAllocation.canFitModel ? '✅ Fits' : '❌ Insufficient']);
      }

      if (results.vramAllocation && results.vramAllocation.offloadedMemoryGB !== undefined && results.vramAllocation.offloadedMemoryGB > 0) {
        const offloadedMem = results.vramAllocation.offloadedMemoryGB >= 1000
          ? `${(results.vramAllocation.offloadedMemoryGB / 1000).toFixed(2)} TB`
          : `${results.vramAllocation.offloadedMemoryGB.toFixed(1)} GB`;
        resultsData.push(['CPU/NVMe Memory (KV Offloading):', offloadedMem]);
      }

      // Add total system data
      resultsData.push(['', '']);
      resultsData.push(['=== TOTAL SYSTEM DATA ===', '']);
      resultsData.push(['Total GPUs Required:', results.unitsNeeded.toString()]);
      resultsData.push(['Total System VRAM:', `${results.totalVRAM.toFixed(0)} GB`]);
      resultsData.push(['Total System FLOPs:', formatFLOPS(results.totalFLOPS || 0)]);
      resultsData.push(['Total System Throughput:', `${results.totalSystemThroughput.toFixed(1)} tokens/sec`]);
      resultsData.push(['System Efficiency:', `${((results.totalSystemThroughput / (results.totalFLOPS || 1)) * 1e12).toFixed(2)} tokens/sec per TFLOPS`]);

      resultsData.push(
        ['Total Overhead:', `${results.totalOverheadPercent.toFixed(0)} %`],
      );

      resultsData.forEach(([label, value]) => {
        if (label === '') {
          yPos += 3;
          return;
        }
        checkPageBreak();
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, leftMargin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, leftMargin + 90, yPos);
        yPos += lineHeight;
      });

      yPos += 5;

      // Section: Overhead Breakdown
      if (results.overheadBreakdown && results.overheadBreakdown.length > 0) {
        checkPageBreak();
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
          checkPageBreak();
          pdf.text(`• ${overhead}`, leftMargin + 5, yPos);
          yPos += lineHeight;
        });
      }

    } // End of GPU else block

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
  // Production-Grade Framework Mode
  useProductionFramework?: boolean;
  setUseProductionFramework?: (value: boolean) => void;
  numUsers?: number;
  setNumUsers?: (value: number) => void;
  tokensPerSecPerUser?: number;
  setTokensPerSecPerUser?: (value: number) => void;
  peakFlops?: number;
  setPeakFlops?: (value: number) => void;
  vramPerGpu?: number;
  setVramPerGpu?: (value: number) => void;
  kernelEfficiency?: number;
  setKernelEfficiency?: (value: number) => void;
  utilizationFactor?: number;
  setUtilizationFactor?: (value: number) => void;
  attentionOverhead?: number;
  setAttentionOverhead?: (value: number) => void;
  prefillOverhead?: number;
  setPrefillOverhead?: (value: number) => void;
  targetHeadroom?: number;
  setTargetHeadroom?: (value: number) => void;
  systemPromptTokensPG?: number;
  setSystemPromptTokensPG?: (value: number) => void;
  sessionHistoryTokensPG?: number;
  setSessionHistoryTokensPG?: (value: number) => void;
  newInputTokensPerRequest?: number;
  setNewInputTokensPerRequest?: (value: number) => void;
  avgResponseTokensPerRequest?: number;
  setAvgResponseTokensPerRequest?: (value: number) => void;
  offloadRatio?: number;
  setOffloadRatio?: (value: number) => void;

  // Legacy fields (for backward compatibility)
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
  calcMode: 'cpu' | 'gpu';
  setCalcMode: (mode: 'cpu' | 'gpu') => void;
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
  // Active KV session fraction and setter (0..1)
  activeKvFraction?: number;
  setActiveKvFraction?: (value: number) => void;
  results: {
    // Production-grade results
    decodeTokensPerSec?: number;
    decodeFlopsPerSec?: number;
    prefillFlopsPerRequest?: number;
    prefillFlopsPerSec?: number;
    requiredFlops?: number;
    effectiveFlopsPerGpu?: number;
    kvVramPerGpu?: number;
    requiredVramPerGpu?: number;
    gpuCountMemory?: number;
    gpuCountCompute?: number;
    gpuCount?: number;

    // Legacy results
    unitsNeeded: number;
    throughputPerUnit: number;
    totalSystemThroughput: number;
    headroom: number;
    totalOverheadPercent: number;
    overheadBreakdown: string[];
    totalVRAM: number;
    totalFLOPS: number;
    requiredFLOPS?: number;
    availableFLOPS?: number;
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
      kvTotalGB?: number;           // Total KV cache required for workload (GB)
      totalMemoryGB?: number;       // model + KV total memory required (GB)
      memoryPerCPU?: number;        // memory required per CPU (GB)
      fitsOnSingleNode?: boolean;
      flopsPerTokenGFLOPS: number;
      totalFlopsTFLOPS: number;
      usableFlopsPerCPU?: number;
      targetTPSPerCPU?: number;    // Computed TPS per CPU using formula
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
    };
  };
}

export default function CapacityPlanner({
  // Production-Grade Framework
  useProductionFramework = false,
  setUseProductionFramework,
  numUsers = 100,
  setNumUsers,
  tokensPerSecPerUser = 10,
  setTokensPerSecPerUser,
  peakFlops = 1e15,
  setPeakFlops,
  vramPerGpu = 96,
  setVramPerGpu,
  kernelEfficiency = 0.5,
  setKernelEfficiency,
  utilizationFactor = 0.8,
  setUtilizationFactor,
  attentionOverhead = 0.1,
  setAttentionOverhead,
  prefillOverhead = 0.1,
  setPrefillOverhead,
  targetHeadroom = 0.1,
  setTargetHeadroom,
  systemPromptTokensPG = 0,
  setSystemPromptTokensPG,
  sessionHistoryTokensPG = 0,
  setSessionHistoryTokensPG,
  newInputTokensPerRequest = 100,
  setNewInputTokensPerRequest,
  avgResponseTokensPerRequest = 50,
  setAvgResponseTokensPerRequest,
  offloadRatio = 0,
  setOffloadRatio,

  // Legacy fields
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
  // Active KV session fraction
  activeKvFraction = 0.05,
  setActiveKvFraction,
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
      {/* Input Panel */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 shadow-sm h-fit">
        <h3 className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent mb-6 pb-4 border-b border-slate-100">
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">⚙️</span> Requirements
        </h3>

        <div className="space-y-2 mb-6">
          <label className="block text-sm font-semibold text-slate-700">Calculation Mode</label>
          <div className="flex gap-2 p-1 bg-slate-100/80 rounded-lg w-fit">
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${calcMode === 'gpu' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              onClick={() => setCalcMode('gpu')}
            >
              GPU Mode
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${calcMode === 'cpu' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              onClick={() => setCalcMode('cpu')}
            >
              CPU Mode
            </button>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            {calcMode === 'gpu' ? 'Uses production-grade GPU sizing framework with explicit FLOPs and memory calculations.' : 'Uses CPU-based sizing with throughput and utilization targets.'}
          </p>
        </div>

        {/* Production-Grade Framework Inputs (GPU Mode) */}
        {calcMode === 'gpu' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
                🚀 Production-Grade LLM GPU Sizing Framework
              </h4>

              {/* User & Throughput */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label htmlFor="pg_num_users" className="block text-sm font-medium text-blue-800">Number of Users</label>
                  <input
                    type="number"
                    id="pg_num_users"
                    value={numUsers}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (setNumUsers) setNumUsers(isNaN(val) ? 100 : val);
                    }}
                    min="1"
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="pg_tokens_per_sec_per_user" className="block text-sm font-medium text-blue-800">Tokens/sec per User</label>
                  <input
                    type="number"
                    id="pg_tokens_per_sec_per_user"
                    value={tokensPerSecPerUser}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (setTokensPerSecPerUser) setTokensPerSecPerUser(isNaN(val) ? 10 : val);
                    }}
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Model Parameters */}
              {!useCustomModelReverse && (
                <div className="space-y-2 mb-4">
                  <label htmlFor="pg_model_params" className="block text-sm font-medium text-blue-800">Model Parameters (Billions)</label>
                  <input
                    type="number"
                    id="pg_model_params"
                    value={parseFloat(model) || 7}
                    onChange={(e) => setModel(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-blue-600">Use Custom Model Configuration below for detailed MoE setup</p>
                </div>
              )}



              {/* Custom Model Toggle */}
              <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-200 mb-4">
                <label className="flex items-center gap-3 cursor-pointer font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={useCustomModelReverse}
                    onChange={(e) => setUseCustomModelReverse(e.target.checked)}
                    className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 border-gray-300"
                  />
                  <span>Use Custom Model Configuration</span>
                </label>
                <p className="mt-2 ml-8 text-xs text-slate-700 font-medium">
                  Enable detailed model configuration with MoE support and custom parameters
                </p>
              </div>

              {/* Custom Model Configuration */}
              {useCustomModelReverse && (
                <div className="bg-emerald-50/50 rounded-lg p-5 border border-emerald-200 mb-4">
                  <h4 className="text-emerald-900 font-bold mb-4 flex items-center gap-2">
                    🎨 Custom Model Configuration
                  </h4>

                  <div className="space-y-2 mb-4">
                    <label htmlFor="pg_custom_total_params" className="block text-sm font-medium text-emerald-800">Total Parameters (Billions)</label>
                    <input
                      type="number"
                      id="pg_custom_total_params"
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
                    <label htmlFor="pg_custom_active_params" className="block text-sm font-medium text-emerald-800">Active Parameters (Billions)</label>
                    <input
                      type="number"
                      id="pg_custom_active_params"
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

                  {/* MoE Architecture Toggle */}
                  <div className="bg-emerald-100/50 rounded-lg p-4 border border-emerald-200 mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useMoeArchitecture}
                        onChange={(e) => setUseMoeArchitecture(e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                      />
                      <span className="text-sm font-medium text-emerald-900">Use Mixture of Experts (MoE) Architecture</span>
                    </label>
                    <p className="text-xs text-emerald-700 mt-2 ml-8">
                      Enable MoE routing where only a subset of experts are active per token, reducing computation while maintaining model capacity.
                    </p>
                  </div>

                  {useMoeArchitecture && (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <label htmlFor="pg_custom_total_experts" className="block text-sm font-medium text-emerald-800">Total Experts</label>
                          <input
                            type="number"
                            id="pg_custom_total_experts"
                            value={customTotalExpertsReverse}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setCustomTotalExpertsReverse(isNaN(val) ? 8 : val);
                            }}
                            min={1}
                            className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="pg_custom_active_experts" className="block text-sm font-medium text-emerald-800">Active Experts</label>
                          <input
                            type="number"
                            id="pg_custom_active_experts"
                            value={customActiveExpertsReverse}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setCustomActiveExpertsReverse(isNaN(val) ? 2 : val);
                            }}
                            min={1}
                            max={customTotalExpertsReverse}
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

              {/* Quantization */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-blue-800">Quantization Level</label>
                <select
                  value={quantization}
                  onChange={(e) => setQuantization(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {QUANTIZATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.name}</option>
                  ))}
                </select>
              </div>

              {/* Shared GPU Selector (replacing Hardware & Efficiency controls) */}
              <GpuSelector
                hardware={hardware}
                setHardware={setHardware}
                quantization={quantization}

                // Efficiency & Overheads (provide defaults for required props)
                kernelEfficiency={kernelEfficiency ?? 0.85}
                setKernelEfficiency={setKernelEfficiency ?? (() => { })}
                utilizationFactor={utilizationFactor ?? 0.8}
                setUtilizationFactor={setUtilizationFactor ?? (() => { })}
                attentionOverhead={attentionOverhead ?? 0.1}
                setAttentionOverhead={setAttentionOverhead ?? (() => { })}
                prefillOverhead={prefillOverhead ?? 0.2}
                setPrefillOverhead={setPrefillOverhead ?? (() => { })}

                // Headroom (capacity mode specific)
                targetHeadroom={targetHeadroom}
                setTargetHeadroom={setTargetHeadroom}
                showHeadroom={true}

                variant="indigo"
              />

              {/* GPU Characteristics (Auto-populated from hardware) */}
              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-200 mb-4 mt-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">GPU Characteristics (Auto-populated)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-blue-700">Peak FLOPs per GPU</label>
                    <div className="px-3 py-2 bg-white border border-blue-300 rounded-md text-sm text-blue-900 font-mono">
                      {(() => {
                        const selectedHW = hardwareDatabase.find(h => h.value === hardware);
                        if (selectedHW) {
                          const ops = parseHardwareOpsFromValue(hardware);
                          return formatFLOPS(ops);
                        }
                        return 'Select hardware above';
                      })()}
                    </div>
                    <p className="text-xs text-blue-600">Auto-calculated from selected GPU</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-blue-700">VRAM per GPU</label>
                    <div className="px-3 py-2 bg-white border border-blue-300 rounded-md text-sm text-blue-900 font-mono">
                      {(() => {
                        const selectedHW = hardwareDatabase.find(h => h.value === hardware);
                        return selectedHW ? `${selectedHW.memory} GB` : 'Select hardware above';
                      })()}
                    </div>
                    <p className="text-xs text-blue-600">Auto-calculated from selected GPU</p>
                  </div>
                </div>
              </div>

              <TokenConfiguration
                systemPromptTokens={systemPromptTokensPG}
                setSystemPromptTokens={setSystemPromptTokensPG!}
                sessionHistoryTokens={sessionHistoryTokensPG}
                setSessionHistoryTokens={setSessionHistoryTokensPG!}
                newInputTokens={newInputTokensPerRequest}
                setNewInputTokens={setNewInputTokensPerRequest!}
                avgResponseTokensPerRequest={avgResponseTokensPerRequest}
                setAvgResponseTokensPerRequest={setAvgResponseTokensPerRequest}
                offloadRatio={offloadRatio}
                setOffloadRatio={setOffloadRatio}
                showOffloadRatio={true}
                variant="blue"
              />
            </div>
          </div>
        )}

        {/* CPU Mode Inputs */}
        {calcMode === 'cpu' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
              <h4 className="text-orange-900 font-bold mb-4 flex items-center gap-2">
                🖥️ CPU-Based Sizing Framework
              </h4>

              {/* Basic Parameters (Users & Throughput) */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label htmlFor="cpu_users" className="block text-sm font-medium text-orange-800">Number of Users</label>
                  <input
                    type="number"
                    id="cpu_users"
                    value={users}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setUsers(isNaN(val) ? 100 : val);
                    }}
                    min="1"
                    className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="cpu_tokens_per_sec" className="block text-sm font-medium text-orange-800">Tokens/sec per User</label>
                  <input
                    type="number"
                    id="cpu_tokens_per_sec"
                    value={tokensPerSec}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTokensPerSec(isNaN(val) ? 10 : val);
                    }}
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Model Parameters */}
              {!useCustomModelReverse && (
                <div className="space-y-2 mb-4">
                  <label htmlFor="cpu_model" className="block text-sm font-medium text-orange-800">Model Parameters (Billions)</label>
                  <input
                    type="number"
                    id="cpu_model"
                    value={parseFloat(model) || 7}
                    onChange={(e) => setModel(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}

              {/* Custom Model Toggle (CPU Mode) */}
              <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-200 mb-4">
                <label className="flex items-center gap-3 cursor-pointer font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={useCustomModelReverse}
                    onChange={(e) => setUseCustomModelReverse(e.target.checked)}
                    className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 border-gray-300"
                  />
                  <span>Use Custom Model Configuration</span>
                </label>
                <p className="mt-2 ml-8 text-xs text-slate-700 font-medium">
                  Enable detailed model configuration with MoE support and custom parameters
                </p>
              </div>

              {/* Custom Model Configuration (CPU Mode) */}
              {useCustomModelReverse && (
                <div className="bg-emerald-50/50 rounded-lg p-5 border border-emerald-200 mb-4">
                  <h4 className="text-emerald-900 font-bold mb-4 flex items-center gap-2">
                    🎨 Custom Model Configuration
                  </h4>

                  <div className="space-y-2 mb-4">
                    <label htmlFor="cpu_custom_total_params" className="block text-sm font-medium text-emerald-800">Total Parameters (Billions)</label>
                    <input
                      type="number"
                      id="cpu_custom_total_params"
                      value={customTotalParamsReverse}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCustomTotalParamsReverse(isNaN(val) ? 1 : val);
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
                    <label htmlFor="cpu_custom_active_params" className="block text-sm font-medium text-emerald-800">Active Parameters (Billions)</label>
                    <input
                      type="number"
                      id="cpu_custom_active_params"
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

                  {/* MoE Architecture Toggle */}
                  <div className="bg-emerald-100/50 rounded-lg p-4 border border-emerald-200 mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useMoeArchitecture}
                        onChange={(e) => setUseMoeArchitecture(e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                      />
                      <span className="text-sm font-medium text-emerald-900">Use Mixture of Experts (MoE) Architecture</span>
                    </label>
                    <p className="text-xs text-emerald-700 mt-2 ml-8">
                      Enable MoE routing where only a subset of experts are active per token, reducing computation while maintaining model capacity.
                    </p>
                  </div>

                  {useMoeArchitecture && (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <label htmlFor="cpu_custom_total_experts" className="block text-sm font-medium text-emerald-800">Total Experts</label>
                          <input
                            type="number"
                            id="cpu_custom_total_experts"
                            value={customTotalExpertsReverse}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setCustomTotalExpertsReverse(isNaN(val) ? 8 : val);
                            }}
                            min={1}
                            className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="cpu_custom_active_experts" className="block text-sm font-medium text-emerald-800">Active Experts</label>
                          <input
                            type="number"
                            id="cpu_custom_active_experts"
                            value={customActiveExpertsReverse}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setCustomActiveExpertsReverse(isNaN(val) ? 2 : val);
                            }}
                            min={1}
                            max={customTotalExpertsReverse}
                            className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="bg-emerald-100/50 p-4 rounded-lg mt-4 text-sm text-emerald-900 border border-emerald-200">
                        <strong>MoE Efficiency:</strong> With {customActiveExpertsReverse} active experts out of {customTotalExpertsReverse} total, you're using {(customActiveParamsReverse / customTotalParamsReverse * 100).toFixed(1)}% of the model's parameters per token.
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Quantization Level */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-orange-800">Quantization Level</label>
                <select
                  value={quantization}
                  onChange={(e) => setQuantization(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {QUANTIZATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.name}</option>
                  ))}
                </select>
              </div>

              <CpuSelector
                // CPU Parameters
                cpuPrefillMultiplier={cpuPrefillMultiplier}
                setCpuPrefillMultiplier={setCpuPrefillMultiplier}
                cpuUtilizationTarget={cpuUtilizationTarget}
                setCpuUtilizationTarget={setCpuUtilizationTarget}
                cpuRedundancy={cpuRedundancy}
                setCpuRedundancy={setCpuRedundancy}
                cpuAMXEfficiency={cpuAMXEfficiency}
                setCpuAMXEfficiency={setCpuAMXEfficiency}
                cpuModelRamOverhead={cpuModelRamOverhead}
                setCpuModelRamOverhead={setCpuModelRamOverhead}

                // Token Config (CPU mode)
                systemPromptTokens={systemPromptTokens}
                setSystemPromptTokens={setSystemPromptTokens}
                sessionHistoryTokens={sessionHistoryTokens}
                setSessionHistoryTokens={setSessionHistoryTokens}
                newInputTokens={newInputTokens}
                setNewInputTokens={setNewInputTokens}
                activeKvFraction={activeKvFraction}
                setActiveKvFraction={setActiveKvFraction}
                showActiveKvFraction={true}
              />

              {/* CPU Hardware Selection */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-orange-800">CPU Hardware</label>
                <select
                  value={hardwareDatabase.find(h => h.value === hardware && h.type === 'cpu')?.value || ''}
                  onChange={(e) => setHardware(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- Select CPU --</option>
                  {hardwareGroups
                    .map((group: any) => ({ family: group.family, options: group.options.filter((hw: any) => hw.type === 'cpu') }))
                    .filter((g: any) => g.options.length > 0)
                    .map((group: any) => (
                      <optgroup key={group.family} label={group.family}>
                        {group.options.map((hw: any, idx: number) => (
                          <option key={idx} value={hw.value}>{hw.name}</option>
                        ))}
                      </optgroup>
                    ))}
                </select>
                <p className="text-xs text-orange-600">CPU options compatible with selected quantization</p>
              </div>

              {/* CPU Characteristics (Auto-populated) */}
              <div className="bg-orange-50/50 rounded-lg p-4 border border-orange-200 mb-4">
                <h4 className="text-sm font-semibold mb-3 text-orange-800">CPU Characteristics (Auto-populated)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-orange-700">Peak FLOPs per CPU</label>
                    <div className="px-3 py-2 bg-white border border-orange-300 rounded-md text-sm font-mono text-orange-900">
                      {(() => {
                        const selectedHW = hardwareDatabase.find(h => h.value === hardware);
                        if (selectedHW) {
                          const ops = parseHardwareOpsFromValue(hardware);
                          return formatFLOPS(ops);
                        }
                        return 'Select hardware above';
                      })()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-orange-700">System RAM per CPU</label>
                    <div className="px-3 py-2 bg-white border border-orange-300 rounded-md text-sm font-mono text-orange-900">
                      {(() => {
                        const selectedHW = hardwareDatabase.find(h => h.value === hardware);
                        return selectedHW ? `${selectedHW.memory} GB` : 'Select hardware above';
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Results Panel */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 h-fit sticky top-6">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h3 className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            <span className="text-2xl">📊</span> Capacity Analysis
          </h3>
          <button
            onClick={() => exportToPDF(calcMode === 'gpu' ? {
              // Production-grade framework inputs
              useProductionFramework: true,
              numUsers, tokensPerSecPerUser, peakFlops, vramPerGpu, kernelEfficiency,
              utilizationFactor, attentionOverhead, prefillOverhead,
              targetHeadroom, systemPromptTokens: systemPromptTokensPG,
              sessionHistoryTokens: sessionHistoryTokensPG, newInputTokens: newInputTokensPerRequest,
              offloadRatio, model, quantization, hardware, useCustomModelReverse, customTotalParamsReverse
            } : {
              // CPU mode inputs
              calcMode: 'cpu',
              users, tokensPerSec, model, quantization, hardware,
              cpuPrefillMultiplier, cpuUtilizationTarget, cpuRedundancy, cpuAMXEfficiency, cpuModelRamOverhead,
              // Token fields for CPU mode
              systemPromptTokens, sessionHistoryTokens, newInputTokens
            }, results)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Export Report
          </button>
        </div>

        {/* Show placeholder when no hardware is selected */}
        {!hardwareDatabase.find(h => h.value === hardware && h.type === (calcMode === 'cpu' ? 'cpu' : 'gpu')) ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Configure parameters to see analysis</h3>
            <p className="text-slate-500">Select hardware and configure your requirements above to view capacity analysis.</p>
          </div>
        ) : calcMode === 'gpu' && results.unitsNeeded > 0 ? (
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

            {/* Production-Grade Framework Results */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                <span>🚀</span> Production-Grade Framework Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-blue-700">Decode Tokens/sec</span>
                    <span className="font-mono text-blue-900 font-semibold">{results.decodeTokensPerSec?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-blue-700">Decode FLOPs/sec</span>
                    <span className="font-mono text-blue-900 font-semibold">{results.decodeFlopsPerSec ? formatFLOPS(results.decodeFlopsPerSec) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-blue-700">Prefill FLOPs/Request</span>
                    <span className="font-mono text-blue-900 font-semibold">{results.prefillFlopsPerRequest ? formatFLOPS(results.prefillFlopsPerRequest) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-blue-700">Prefill FLOPs/sec</span>
                    <span className="font-mono text-blue-900 font-semibold">{results.prefillFlopsPerSec ? formatFLOPS(results.prefillFlopsPerSec) : 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-blue-700">Required FLOPs <span className="text-xs text-slate-500 font-normal">(workload only)</span></span>
                    <span className="font-mono text-blue-900 font-semibold">{results.requiredFlops ? formatFLOPS(results.requiredFlops) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-blue-700">Effective FLOPs/GPU</span>
                    <span className="font-mono text-blue-900 font-semibold">{results.effectiveFlopsPerGpu ? formatFLOPS(results.effectiveFlopsPerGpu) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-blue-700">KV VRAM/GPU</span>
                    <span className="font-mono text-blue-900 font-semibold">{results.kvVramPerGpu?.toFixed(1) || 'N/A'} GB</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-blue-700">Required VRAM/GPU</span>
                    <span className="font-mono text-blue-900 font-semibold">{results.requiredVramPerGpu?.toFixed(1) || 'N/A'} GB</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-100/50 p-3 rounded-lg text-center">
                  <div className="text-xs text-blue-700 font-semibold uppercase mb-1">Memory GPUs</div>
                  <div className="text-xl font-bold text-blue-900">{results.gpuCountMemory || 'N/A'}</div>
                </div>
                <div className="bg-blue-100/50 p-3 rounded-lg text-center">
                  <div className="text-xs text-blue-700 font-semibold uppercase mb-1">Compute GPUs</div>
                  <div className="text-xl font-bold text-blue-900">{results.gpuCountCompute || 'N/A'}</div>
                </div>
                <div className="bg-blue-100/50 p-3 rounded-lg text-center">
                  <div className="text-xs text-blue-700 font-semibold uppercase mb-1">Final GPUs</div>
                  <div className="text-xl font-bold text-blue-900">{results.gpuCount || results.unitsNeeded}</div>
                </div>
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
                  <span className="font-semibold text-slate-900">{useProductionFramework ? numUsers : users}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Tokens/sec/User</span>
                  <span className="font-semibold text-slate-900">{useProductionFramework ? tokensPerSecPerUser : tokensPerSec}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Quantization</span>
                  <span className="font-semibold text-slate-900">{quantization.toUpperCase()}</span>
                </div>
                {(useKVCache || useProductionFramework) && (
                  <>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">System Tokens</span>
                      <span className="font-semibold text-slate-900">{useProductionFramework ? systemPromptTokensPG : systemPromptTokens}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Context/History</span>
                      <span className="font-semibold text-slate-900">{useProductionFramework ? sessionHistoryTokensPG : sessionHistoryTokens}</span>
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
                  <span className="font-mono text-emerald-700">{(results.totalSystemThroughput > 0 && results.requiredFLOPS) ? formatFLOPS(results.requiredFLOPS / results.totalSystemThroughput) : 'N/A'}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Required System FLOPs</span>
                  <span className="font-mono text-emerald-700">{formatFLOPS(results.requiredFLOPS || 0)} <span className="text-xs text-slate-500">(workload only)</span></span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Available System FLOPs</span>
                  <span className="font-mono text-emerald-700">{formatFLOPS(results.availableFLOPS || 0)}</span>
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

            <div className="text-xs text-slate-400 mt-4 italic text-center">
              <strong>{INFO_CONTENT.productionPlanning}</strong>
            </div>

          </div>
        ) : calcMode === 'cpu' && results.cpuSizing ? (
          <CpuResults cpuSizing={results.cpuSizing} />
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
