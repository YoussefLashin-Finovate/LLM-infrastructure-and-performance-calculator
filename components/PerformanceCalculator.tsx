'use client';
import { hardwareDatabase } from '@/lib/hardwareDatabase';
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
import QuantizationSelect from '@/components/QuantizationSelect';

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

// Export calculation results as professional PDF for client tenders
async function exportToPDF(inputs: any, results: any) {
  try {
    const jsPDF = (await import('jspdf')).default;

    // Calculate model size based on inputs
    const effectiveModelParams = inputs.model === 'custom' ? inputs.customTotalParams : parseFloat(inputs.model);
    const modelSizeGB = calculateModelSize(effectiveModelParams, inputs.quantization);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPos = 20;
    const leftMargin = 20;
    const rightMargin = 190;
    const lineHeight = 7;

    // Header
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, 210, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LLM Infrastructure Report', leftMargin, 20);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Performance Analysis', leftMargin, 30);
    pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), leftMargin, 36);

    yPos = 55;
    pdf.setTextColor(0, 0, 0);

    // Section: Configuration
    pdf.setFillColor(59, 130, 246);
    pdf.rect(leftMargin - 5, yPos - 5, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONFIGURATION', leftMargin, yPos);
    yPos += 12;

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    const selectedHW = hardwareDatabase.find(hw => hw.value === inputs.hardware);
    const memoryLabel = selectedHW ? getMemoryLabel(selectedHW.value) : 'VRAM';

    const configData = [
      ['Model Size:', `${parseFloat(inputs.model).toFixed(1)}B parameters`],
      ['Quantization:', inputs.quantization.toUpperCase()],
      ['Hardware:', selectedHW?.name || 'N/A'],
      [`Hardware ${memoryLabel}:`, `${selectedHW?.memory || 'N/A'} GB`],
      ['Hardware FLOPS:', formatFLOPS(parseFloat(inputs.hardware.split(',')[0]) * 1e12)],
      ['Utilization Factor:', `${(inputs.utilization * 100).toFixed(0)}%`],
      ['Input Length:', `${inputs.inputLength} tokens`],
      ['Response Length:', `${inputs.responseLength} tokens`],
      ['Think Time:', `${inputs.thinkTime}s`],
    ];

    if (inputs.useKVCache) {
      configData.push(
        ['System Tokens:', `${inputs.systemPromptTokens} (cached)`],
        ['History Tokens:', `${inputs.sessionHistoryTokens} (cached)`],
        ['Input Tokens:', `${inputs.newInputTokens} (per request)`]
      );
    }

    configData.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, leftMargin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, leftMargin + 60, yPos);
      yPos += lineHeight;
    });

    yPos += 5;

    // Section: Performance Results
    pdf.setFillColor(16, 185, 129);
    pdf.rect(leftMargin - 5, yPos - 5, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PERFORMANCE METRICS', leftMargin, yPos);
    yPos += 12;

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    const metricsData = [
      ['Theoretical Throughput:', `${results.theoretical.toFixed(1)} tokens/sec`],
      ['Realistic Throughput:', `${results.realistic.toFixed(1)} tokens/sec`],
      ['Words per Second:', `${results.words.toFixed(1)} words/sec`],
      ['', ''],
      ['Concurrent Users Supported:', results.users.toFixed(1)],
      ['Tokens/sec per User:', `${results.tokensPerSecPerUser.toFixed(1)}`],
      ['', ''],
      ['Model Memory Footprint:', `${modelSizeGB.toFixed(1)} GB`],
    ];

    if (results.vramAllocation && results.vramAllocation.kvCacheGB > 0) {
      metricsData.push(['KV Cache Memory:', `${results.vramAllocation.kvCacheGB.toFixed(2)} GB`]);
      metricsData.push([`Total ${memoryLabel} Used:`, `${results.vramAllocation.totalUsedGB.toFixed(1)} GB`]);
    }

    metricsData.push(
      [`Available ${memoryLabel}:`, `${selectedHW?.memory || 'N/A'} GB`],
      ['Memory Bound:', results.isMemoryBound ? 'Yes' : 'No'],
    );

    if (results.prefillOverhead > 0) {
      metricsData.push(['Prefill Overhead:', `${(results.prefillOverhead * 100).toFixed(1)}%`]);
    }

    if (results.attentionOverhead > 0) {
      metricsData.push(['Attention Overhead:', `${(results.attentionOverhead * 100).toFixed(1)}%`]);
    }

    metricsData.forEach(([label, value]) => {
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

    // Section: Summary
    pdf.setFillColor(100, 116, 139);
    pdf.rect(leftMargin - 5, yPos - 5, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SUMMARY', leftMargin, yPos);
    yPos += 12;

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    const summaryText = `This ${parseFloat(inputs.model).toFixed(1)}B parameter model running on ${selectedHW?.name || 'selected hardware'} ` +
      `can support ${results.users.toFixed(1)} concurrent users with ${results.realistic.toFixed(1)} tokens/sec throughput ` +
      `(${results.words.toFixed(1)} words/sec). Each user receives ${results.tokensPerSecPerUser.toFixed(1)} tokens/sec ` +
      `with a ${inputs.thinkTime}s think time between requests.`;

    const splitText = pdf.splitTextToSize(summaryText, 170);
    splitText.forEach((line: string) => {
      pdf.text(line, leftMargin, yPos);
      yPos += lineHeight;
    });

    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Generated by LLM Infrastructure Calculator', leftMargin, 275);
    pdf.text(`Report ID: PERF-${Date.now()}`, leftMargin, 280);
    pdf.text('© 2025 Finovate Team. All rights reserved.', leftMargin, 285);

    pdf.save(`Infrastructure-Performance-Report-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

interface PerformanceCalculatorProps {
  model: string;
  setModel: (value: string) => void;
  quantization: string;
  setQuantization: (value: string) => void;
  hardware: string;
  setHardware: (value: string) => void;
  utilization: number;
  setUtilization: (value: number) => void;
  inputLength: number;
  setInputLength: (value: number) => void;
  responseLength: number;
  setResponseLength: (value: number) => void;
  thinkTime: number;
  setThinkTime: (value: number) => void;
  useKVCache: boolean;
  setUseKVCache: (value: boolean) => void;
  kvOffloading: boolean;
  setKvOffloading: (value: boolean) => void;
  systemPromptTokens: number;
  setSystemPromptTokens: (value: number) => void;
  sessionHistoryTokens: number;
  setSessionHistoryTokens: (value: number) => void;
  newInputTokens: number;
  setNewInputTokens: (value: number) => void;
  useMoeArchitecture: boolean;
  setUseMoeArchitecture: (value: boolean) => void;
  useCustomModel: boolean;
  setUseCustomModel: (value: boolean) => void;
  customTotalParams: number;
  setCustomTotalParams: (value: number) => void;
  customActiveParams: number;
  setCustomActiveParams: (value: number) => void;
  customTotalExperts: number;
  setCustomTotalExperts: (value: number) => void;
  customActiveExperts: number;
  setCustomActiveExperts: (value: number) => void;
  results: {
    theoretical: number;
    realistic: number;
    users: number;
    words: number;
    tokensPerSecPerUser: number;
    isMemoryBound: boolean;
    prefillOverhead: number;
    attentionOverhead: number;
    vramAllocation?: {
      modelWeightsGB: number;
      kvCacheGB: number;
      safetyBufferGB: number;
      totalUsedGB: number;
      availableGB: number;
      canFitModel: boolean;
      warnings: string[];
    };
  };
}

export default function PerformanceCalculator({
  model,
  setModel,
  quantization,
  setQuantization,
  hardware,
  setHardware,
  utilization,
  setUtilization,
  inputLength,
  setInputLength,
  responseLength,
  setResponseLength,
  thinkTime,
  setThinkTime,
  useKVCache,
  setUseKVCache,
  kvOffloading,
  setKvOffloading,
  systemPromptTokens,
  setSystemPromptTokens,
  sessionHistoryTokens,
  setSessionHistoryTokens,
  newInputTokens,
  setNewInputTokens,
  useMoeArchitecture,
  setUseMoeArchitecture,
  useCustomModel,
  setUseCustomModel,
  customTotalParams,
  setCustomTotalParams,
  customActiveParams,
  setCustomActiveParams,
  customTotalExperts,
  setCustomTotalExperts,
  customActiveExperts,
  setCustomActiveExperts,
  results,
}: PerformanceCalculatorProps) {
  const hardwareGroups = useHardwareGroups(quantization);

  // Calculate model size for display
  const effectiveModelParams = (useCustomModel || model === 'custom') ? customTotalParams : parseFloat(model);
  const modelSizeGB = calculateModelSize(effectiveModelParams, quantization);

  const { theoretical, realistic, users, words, tokensPerSecPerUser, isMemoryBound, prefillOverhead, attentionOverhead, vramAllocation } = results;

  const performanceNotes = [];
  if (isMemoryBound) performanceNotes.push('Memory-bound');
  if (prefillOverhead > 0) performanceNotes.push(`${(prefillOverhead * 100).toFixed(0)}% prefill overhead`);
  if (attentionOverhead > 0) performanceNotes.push(`${(attentionOverhead * 100).toFixed(0)}% attention overhead`);
  const noteText = performanceNotes.length > 0 ? ` (${performanceNotes.join(', ')})` : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Workload Settings Panel */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm h-fit">
        <h3 className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent mb-6 pb-4 border-b border-slate-100">
          <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">🎛️</span> Input Parameters
        </h3>

        <div className="space-y-2 mb-6">
          <label htmlFor="calc_model" className="block text-sm font-semibold text-slate-700">Model Size</label>
          <div className="relative">
            <select
              id="calc_model"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setUseCustomModel(e.target.value === 'custom');
              }}
              className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none shadow-sm transition-all hover:border-blue-300"
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
        {useCustomModel && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-5 border border-emerald-200 mb-6">
            <h4 className="text-emerald-900 font-bold mb-4 flex items-center gap-2">
              <span className="text-lg">🎨</span> Custom Model Configuration
            </h4>

            <div className="space-y-2 mb-4">
              <label htmlFor="custom_total_params" className="block text-sm font-medium text-emerald-800">Total Parameters (Billions)</label>
              <input
                type="number"
                id="custom_total_params"
                value={customTotalParams}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCustomTotalParams(isNaN(val) ? 1 : val);
                  // Auto-set active params to match total for dense models
                  if (!useMoeArchitecture) {
                    setCustomActiveParams(isNaN(val) ? 1 : val);
                  }
                }}
                min={0.1}
                step={0.1}
                className="w-full px-3 py-2 bg-white/80 border border-emerald-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-emerald-700">Total model parameters including all experts (if MoE)</p>
            </div>

            <div className="space-y-2 mb-4">
              <label htmlFor="custom_active_params" className="block text-sm font-medium text-emerald-800">Active Parameters (Billions)</label>
              <input
                type="number"
                id="custom_active_params"
                value={customActiveParams}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCustomActiveParams(isNaN(val) ? 1 : val);
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
                    <label htmlFor="custom_total_experts" className="block text-sm font-medium text-emerald-800">Total Experts</label>
                    <input
                      type="number"
                      id="custom_total_experts"
                      value={customTotalExperts}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setCustomTotalExperts(isNaN(val) ? 1 : val);
                      }}
                      min={1}
                      step={1}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="custom_active_experts" className="block text-sm font-medium text-emerald-800">Active Experts</label>
                    <input
                      type="number"
                      id="custom_active_experts"
                      value={customActiveExperts}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setCustomActiveExperts(isNaN(val) ? 1 : val);
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
                    <li>Total: {customTotalParams}B params → VRAM: {(customTotalParams * (quantization === 'fp16' ? 2 : quantization === 'int8' ? 1 : 0.5)).toFixed(1)}GB</li>
                    <li>Active: {customActiveParams}B params ({((customActiveParams / customTotalParams) * 100).toFixed(1)}% of total)</li>
                    <li>Experts: {customActiveExperts}/{customTotalExperts} active ({((customActiveExperts / customTotalExperts) * 100).toFixed(1)}%)</li>
                    <li>Compute reduction: {((1 - customActiveParams / customTotalParams) * 100).toFixed(1)}%</li>
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
          <QuantizationSelect
            id="calc_quantization"
            value={quantization as import('@/lib/types').QuantizationType}
            onChange={(v) => setQuantization(v)}
          />
          <p className="text-xs text-slate-500">{HELPER_TEXT.quantizationNote}</p>
        </div>

        <div className="space-y-2 mb-6">
          <label htmlFor="calc_hardware" className="block text-sm font-semibold text-slate-700">Hardware Configuration</label>
          <select
            id="calc_hardware"
            value={hardware}
            onChange={(e) => setHardware(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {hardwareGroups.map((group: any) => (
              <optgroup key={group.family} label={group.family} className="font-bold text-slate-900 bg-slate-50">
                {group.options.map((hw: any, idx: number) => {
                  const memDisplay = hw.type === 'cpu'
                    ? `(Max: ${hw.memory >= 1000 ? (hw.memory / 1000).toFixed(1) + 'TB' : hw.memory + 'GB'} DDR5)`
                    : `- ${hw.memory}GB VRAM`;
                  return (
                    <option key={idx} value={hw.value} className="text-slate-700 bg-white">
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
          <label htmlFor="calc_util" className="block text-sm font-semibold text-slate-700">Utilization Factor</label>
          <input
            type="number"
            id="calc_util"
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
        </div>

        {useKVCache && (
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
                ? '✓ GPU count based on COMPUTE only (KV cache stored in CPU RAM/NVMe)'
                : '✗ GPU count based on VRAM (model + KV cache must fit in GPU memory)'}
            </p>
          </div>
        )}

        {!useKVCache ? (
          <div className="space-y-2 mb-6">
            <label htmlFor="calc_input" className="block text-sm font-semibold text-slate-700">Avg Input Length (tokens)</label>
            <input
              type="number"
              id="calc_input"
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
              <label htmlFor="calc_system_prompt" className="block text-sm font-semibold text-slate-700">System Prompt (tokens) - Per Session</label>
              <input
                type="number"
                id="calc_system_prompt"
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
              <label htmlFor="calc_history" className="block text-sm font-semibold text-slate-700">Session History (tokens) - Per Session</label>
              <input
                type="number"
                id="calc_history"
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
              <label htmlFor="calc_new_input" className="block text-sm font-semibold text-blue-700">New Input (tokens) - Per Request</label>
              <input
                type="number"
                id="calc_new_input"
                value={newInputTokens}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setNewInputTokens(Math.min(Math.max(val, 1), 100000));
                }}
                step="50"
                min="1"
                max="100000"
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-blue-600">User's new input requiring prefill compute every request</p>
            </div>
          </div>
        )}

        <div className="space-y-2 mb-6">
          <label htmlFor="calc_response" className="block text-sm font-semibold text-slate-700">Avg Response Length (tokens)</label>
          <input
            type="number"
            id="calc_response"
            value={responseLength}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setResponseLength(isNaN(val) ? 10 : val);
            }}
            step={CALCULATION_CONSTANTS.steps.responseLength}
            min="10"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2 mb-6">
          <label htmlFor="calc_think" className="block text-sm font-semibold text-slate-700">Think Time (seconds)</label>
          <input
            type="number"
            id="calc_think"
            value={thinkTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setThinkTime(isNaN(val) ? 0.5 : val);
            }}
            step={CALCULATION_CONSTANTS.steps.thinkTime}
            min={CALCULATION_CONSTANTS.minThinkTime}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-slate-500">{HELPER_TEXT.thinkTimeNote}</p>
        </div>
      </div>

      {/* Performance Results Panel */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 h-fit sticky top-6">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            Performance Analysis
          </h3>
          <button
            onClick={() => exportToPDF({
              model, quantization, hardware, utilization, inputLength, responseLength, thinkTime,
              systemPromptTokens, sessionHistoryTokens, newInputTokens, useKVCache
            }, results)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            Export Report
          </button>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 mb-4">
          <div className="text-sm font-medium text-slate-500 mb-1">Theoretical Throughput</div>
          <div className="text-3xl font-bold text-slate-900 mb-2">{theoretical.toFixed(1)} <span className="text-base font-normal text-slate-500">tok/s</span></div>
          <div className="text-xs text-slate-400 font-mono bg-slate-100 p-2 rounded border border-slate-200 overflow-x-auto">
            {formatFLOPS(parseFloat(hardware.split(',')[0]) * 1e12)} ÷ (6 × {model}B × 1e9) = {theoretical.toFixed(1)} tokens/sec
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 mb-4">
          <div className="text-sm font-medium text-blue-800 mb-1">Realistic Throughput</div>
          <div className="text-3xl font-bold text-blue-900 mb-1">{realistic.toFixed(1)} <span className="text-base font-normal text-blue-700">tok/s</span></div>
          <div className="text-sm text-blue-700 mb-2">≈{words.toFixed(1)} words/sec{noteText}</div>
          <div className="text-xs text-blue-600 font-mono bg-blue-100/50 p-2 rounded border border-blue-200 overflow-x-auto">
            {theoretical.toFixed(1)} × [{utilization} (util) × {QUANTIZATION_OPTIONS.find(q => q.value === quantization)?.efficiency || 0.95} (quant)] = {realistic.toFixed(1)} tokens/sec
          </div>
        </div>

        <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 mb-4">
          <div className="text-sm font-medium text-indigo-800 mb-1">Concurrent Users</div>
          <div className="text-3xl font-bold text-indigo-900 mb-1">{users.toFixed(1)}</div>
          <div className="text-sm text-indigo-700 mb-2">({tokensPerSecPerUser.toFixed(1)} tokens/sec per user, {thinkTime}s think time)</div>
          <div className="text-xs text-indigo-600 font-mono bg-indigo-100/50 p-2 rounded border border-indigo-200 overflow-x-auto">
            {realistic.toFixed(1)} ÷ ({responseLength} ÷ {thinkTime}) = {users.toFixed(1)} concurrent users
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 mb-6">
          <div className="text-sm font-medium text-slate-500 mb-1">Hardware Resources</div>
          <div className="text-xl font-bold text-slate-800 mb-2">{(() => {
            const selectedHW = hardwareDatabase.find(hw => hw.value === hardware);
            const memLabel = selectedHW ? getMemoryLabel(selectedHW.value) : 'VRAM';
            return selectedHW ? `${selectedHW.memory} GB ${memLabel}` : 'N/A';
          })()}</div>

          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>Model Size ({quantization.toUpperCase()})</span>
              <span className="font-mono">{modelSizeGB.toFixed(1)} GB</span>
            </div>
            {vramAllocation && vramAllocation.kvCacheGB > 0 && (
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>KV Cache</span>
                <span className="font-mono">{vramAllocation.kvCacheGB.toFixed(2)} GB</span>
              </div>
            )}
            {vramAllocation && vramAllocation.safetyBufferGB > 0 && (
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>Safety Buffer</span>
                <span className="font-mono">{vramAllocation.safetyBufferGB.toFixed(1)} GB</span>
              </div>
            )}
            {vramAllocation ? (
              <div className="flex justify-between font-bold text-slate-800 pt-1">
                <span>Total Used</span>
                <span className={vramAllocation.totalUsedGB > vramAllocation.availableGB ? "text-red-600" : "text-emerald-600"}>
                  {vramAllocation.totalUsedGB.toFixed(1)} GB
                </span>
              </div>
            ) : (
              <div className="flex justify-between pt-1">
                <span>FLOPS</span>
                <span className="font-mono">{formatFLOPS(parseFloat(hardware.split(',')[0]) * 1e12)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800 leading-relaxed">
          <strong>Note:</strong> {INFO_CONTENT.performanceCalculation}
        </div>
      </div>
    </div>
  );
}
