'use client';

import { useState, useEffect } from 'react';
import PerformanceCalculator from './PerformanceCalculator';
import CapacityPlanner from './CapacityPlanner';
import { usePerformanceCalculation } from '@/hooks/usePerformanceCalculation';
import { useCapacityCalculation } from '@/hooks/useCapacityCalculation';
import { useHardwareFilter } from '@/hooks/useHardwareFilter';
import { DEFAULT_VALUES, UI_CONFIG } from '@/lib/config';
import { cn } from '@/lib/utils';

export default function AdvancedCalculator() {
  // Performance Calculator State
  const [model, setModel] = useState(DEFAULT_VALUES.performance.model);
  const [quantization, setQuantization] = useState(DEFAULT_VALUES.performance.quantization);
  const [hardware, setHardware] = useState(DEFAULT_VALUES.performance.hardware);
  const [utilization, setUtilization] = useState(DEFAULT_VALUES.performance.utilization);
  const [inputLength, setInputLength] = useState(DEFAULT_VALUES.performance.inputLength);
  const [responseLength, setResponseLength] = useState(DEFAULT_VALUES.performance.responseLength);
  const [thinkTime, setThinkTime] = useState(DEFAULT_VALUES.performance.thinkTime);

  // KV Cache toggle and token breakdown
  const [useKVCache, setUseKVCache] = useState(false);
  const [kvOffloading, setKvOffloading] = useState(false);
  const [systemPromptTokens, setSystemPromptTokens] = useState(500);
  const [sessionHistoryTokens, setSessionHistoryTokens] = useState(2000);
  const [newInputTokens, setNewInputTokens] = useState(512);

  // MoE Architecture Toggle
  const [useMoeArchitecture, setUseMoeArchitecture] = useState(false);

  // Custom Model Configuration
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [customTotalParams, setCustomTotalParams] = useState(70);
  const [customActiveParams, setCustomActiveParams] = useState(70);
  const [customTotalExperts, setCustomTotalExperts] = useState(8);
  const [customActiveExperts, setCustomActiveExperts] = useState(2);

  // Capacity Planner State
  const [reverseModel, setReverseModel] = useState(DEFAULT_VALUES.capacity.model);
  const [reverseQuantization, setReverseQuantization] = useState(DEFAULT_VALUES.capacity.quantization);
  const [reverseUsers, setReverseUsers] = useState(DEFAULT_VALUES.capacity.users);
  const [reverseInput, setReverseInput] = useState(DEFAULT_VALUES.capacity.inputLength);
  const [reverseTokens, setReverseTokens] = useState(DEFAULT_VALUES.capacity.tokensPerSec);
  const [reverseHardware, setReverseHardware] = useState(DEFAULT_VALUES.capacity.hardware);
  const [reverseUtil, setReverseUtil] = useState(DEFAULT_VALUES.capacity.utilization);

  // KV Cache toggle and token breakdown for capacity planner
  const [reverseUseKVCache, setReverseUseKVCache] = useState(false);
  const [reverseKvOffloading, setReverseKvOffloading] = useState(false);
  const [reverseKvOffloadingPercentage, setReverseKvOffloadingPercentage] = useState(100);
  const [reverseSystemPromptTokens, setReverseSystemPromptTokens] = useState(500);
  const [reverseSessionHistoryTokens, setReverseSessionHistoryTokens] = useState(2000);
  const [reverseNewInputTokens, setReverseNewInputTokens] = useState(512);

  // MoE Architecture Toggle for capacity planner
  const [reverseUseMoeArchitecture, setReverseUseMoeArchitecture] = useState(false);

  // Custom Model Configuration for capacity planner
  const [reverseUseCustomModel, setReverseUseCustomModel] = useState(false);
  const [reverseCustomTotalParams, setReverseCustomTotalParams] = useState(70);
  const [reverseCustomActiveParams, setReverseCustomActiveParams] = useState(70);
  const [reverseCustomTotalExperts, setReverseCustomTotalExperts] = useState(8);
  const [reverseCustomActiveExperts, setReverseCustomActiveExperts] = useState(2);

  // UI State
  const [activeTab, setActiveTab] = useState<'performance' | 'capacity'>('performance');

  // Production-Grade Framework State
  const [useProductionFramework, setUseProductionFramework] = useState(false);
  const [numUsers, setNumUsers] = useState(100);
  const [tokensPerSecPerUser, setTokensPerSecPerUser] = useState(10);
  const [peakFlops, setPeakFlops] = useState(1e15); // H100 default
  const [vramPerGpu, setVramPerGpu] = useState(96); // H100 default
  const [kernelEfficiency, setKernelEfficiency] = useState(0.5);
  const [utilizationFactor, setUtilizationFactor] = useState(0.8);
  const [attentionOverhead, setAttentionOverhead] = useState(0.1);
  const [prefillOverhead, setPrefillOverhead] = useState(0.1);
  const [targetHeadroom, setTargetHeadroom] = useState(0.1);
  const [systemPromptTokensPG, setSystemPromptTokensPG] = useState(0);
  const [sessionHistoryTokensPG, setSessionHistoryTokensPG] = useState(0);
  const [newInputTokensPerRequest, setNewInputTokensPerRequest] = useState(100);
  const [avgResponseTokensPerRequest, setAvgResponseTokensPerRequest] = useState(50);
  const [offloadRatio, setOffloadRatio] = useState(0);

  // CPU/GPU mode and CPU-specific overrides
  const [calcMode, setCalcMode] = useState<'cpu' | 'gpu'>('gpu');
  const [cpuPrefillMultiplier, setCpuPrefillMultiplier] = useState(0.5);
  const [cpuUtilizationTarget, setCpuUtilizationTarget] = useState(0.3);
  const [cpuRedundancy, setCpuRedundancy] = useState(0.1);
  const [cpuAMXEfficiency, setCpuAMXEfficiency] = useState(0.8);
  const [cpuModelRamOverhead, setCpuModelRamOverhead] = useState(0.2);

  // Active KV session fraction (percentage of users with resident KV cache)
  const [activeKvSessionFraction, setActiveKvSessionFraction] = useState(0.05); // default 5%

  // Use custom hooks for calculations
  const [performanceUnits, setPerformanceUnits] = useState(1);
  const [avgResponseTokensPerRequestPerf, setAvgResponseTokensPerRequestPerf] = useState(50);
  const [performanceIsCPU, setPerformanceIsCPU] = useState(calcMode === 'cpu');

  // Keep perf device in sync with calcMode when global mode changes
  useEffect(() => {
    setPerformanceIsCPU(calcMode === 'cpu');
  }, [calcMode]);

  const performanceResults = usePerformanceCalculation({
    model,
    hardware,
    utilization,
    inputLength,
    responseLength,
    thinkTime,
    useKVCache,
    kvOffloading,
    systemPromptTokens,
    sessionHistoryTokens,
    newInputTokens,
    useMoeArchitecture,
    useCustomModel,
    customTotalParams,
    customActiveParams,
    customTotalExperts,
    customActiveExperts,
    units: performanceUnits,
    avgResponseTokensPerRequest: avgResponseTokensPerRequestPerf,
    tokensPerSecPerUser,
    // Device-specific
    isCPU: performanceIsCPU,
    kernelEfficiency,
    cpuAMXEfficiency,
    cpuUtilizationTarget
  });



  const capacityResults = useCapacityCalculation({
    // Production-grade framework
    useProductionFramework,
    numUsers,
    tokensPerSecPerUser,
    peakFlops,
    vramPerGpu,
    kernelEfficiency,
    utilizationFactor,
    attentionOverhead,
    prefillOverhead,
    targetHeadroom,
    systemPromptTokensPG,
    sessionHistoryTokensPG,
    newInputTokensPerRequest,
    avgResponseTokensPerRequest,
    offloadRatio,
    
    // Legacy fields
    model: reverseModel,
    hardware: reverseHardware,
    quantization: reverseQuantization,
    users: reverseUsers,
    inputLength: reverseInput,
    tokensPerSec: reverseTokens,
    utilization: reverseUtil,
    useKVCache: reverseUseKVCache,
    kvOffloading: reverseKvOffloading,
    kvOffloadingPercentage: reverseKvOffloadingPercentage,
    systemPromptTokens: reverseSystemPromptTokens,
    sessionHistoryTokens: reverseSessionHistoryTokens,
    newInputTokens: reverseNewInputTokens,
    useMoeArchitecture: useProductionFramework ? useMoeArchitecture : reverseUseMoeArchitecture,
    useCustomModel: useProductionFramework ? useCustomModel : reverseUseCustomModel,
    customTotalParams: useProductionFramework ? customTotalParams : reverseCustomTotalParams,
    customActiveParams: useProductionFramework ? customActiveParams : reverseCustomActiveParams,
    customTotalExperts: useProductionFramework ? customTotalExperts : reverseCustomTotalExperts,
    customActiveExperts: useProductionFramework ? customActiveExperts : reverseCustomActiveExperts,
    // Forward CPU overrides
    cpuPrefillMultiplier,
    cpuUtilizationTarget,
    cpuRedundancy,
    cpuAMXEfficiency,
    cpuModelRamOverhead,
    // Active KV session fraction
    activeKvFraction: activeKvSessionFraction
  });

  // Hardware filtering hooks
  const { available: availableHardware } = useHardwareFilter(quantization);
  const { available: availableReverseHardware } = useHardwareFilter(reverseQuantization);

  // Auto-select hardware when user forces CPU/GPU mode
  useEffect(() => {
    if (calcMode === 'cpu') {
      const cpuOption = availableReverseHardware.find(hw => hw.type === 'cpu' && hw.quantTypes.includes(reverseQuantization));
      if (cpuOption) setReverseHardware(cpuOption.value);
    }
    if (calcMode === 'gpu') {
      const gpuOption = availableReverseHardware.find(hw => hw.type === 'gpu' && hw.quantTypes.includes(reverseQuantization));
      if (gpuOption) setReverseHardware(gpuOption.value);
    }
  }, [calcMode, reverseQuantization, availableReverseHardware]);

  // Keep performance calculator in sync with capacity planner selection
  useEffect(() => {
    const selectedReverse = availableReverseHardware.find(hw => hw.value === reverseHardware);
    if (!selectedReverse) return;

    // When user selects a hardware in Capacity Planner, force global mode and mirror the hardware into Performance if possible
    if (selectedReverse.type === 'cpu') {
      setCalcMode('cpu');
      const perfMatch = availableHardware.find(hw => hw.value === reverseHardware);
      if (perfMatch) setHardware(perfMatch.value);
      else {
        const cpuPerfOption = availableHardware.find(hw => hw.type === 'cpu' && hw.quantTypes.includes(quantization));
        if (cpuPerfOption) setHardware(cpuPerfOption.value);
      }
    } else {
      setCalcMode('gpu');
      const perfMatch = availableHardware.find(hw => hw.value === reverseHardware);
      if (perfMatch) setHardware(perfMatch.value);
      else {
        const gpuPerfOption = availableHardware.find(hw => hw.type === 'gpu' && hw.quantTypes.includes(quantization));
        if (gpuPerfOption) setHardware(gpuPerfOption.value);
      }
    }
  }, [reverseHardware, availableReverseHardware, availableHardware, quantization, reverseQuantization, setCalcMode]);

  // Ensure when calcMode changes, both Performance and Capacity hardware are compatible with the mode
  useEffect(() => {
    if (calcMode === 'cpu') {
      // Performance HW
      const perfHw = availableHardware.find(hw => hw.value === hardware);
      if (!perfHw || perfHw.type !== 'cpu') {
        const cpuOption = availableHardware.find(hw => hw.type === 'cpu' && hw.quantTypes.includes(quantization));
        if (cpuOption) setHardware(cpuOption.value);
      }
      // Capacity HW
      const revHw = availableReverseHardware.find(hw => hw.value === reverseHardware);
      if (!revHw || revHw.type !== 'cpu') {
        const cpuRev = availableReverseHardware.find(hw => hw.type === 'cpu' && hw.quantTypes.includes(reverseQuantization));
        if (cpuRev) setReverseHardware(cpuRev.value);
      }
    } else {
      const perfHw = availableHardware.find(hw => hw.value === hardware);
      if (!perfHw || perfHw.type !== 'gpu') {
        const gpuOption = availableHardware.find(hw => hw.type === 'gpu' && hw.quantTypes.includes(quantization));
        if (gpuOption) setHardware(gpuOption.value);
      }
      const revHw = availableReverseHardware.find(hw => hw.value === reverseHardware);
      if (!revHw || revHw.type !== 'gpu') {
        const gpuRev = availableReverseHardware.find(hw => hw.type === 'gpu' && hw.quantTypes.includes(reverseQuantization));
        if (gpuRev) setReverseHardware(gpuRev.value);
      }
    }
  }, [calcMode, availableHardware, availableReverseHardware, quantization, reverseQuantization, hardware, reverseHardware]);

  // Set production framework based on calcMode
  useEffect(() => {
    setUseProductionFramework(calcMode === 'gpu');
  }, [calcMode, setUseProductionFramework]);


  // Auto-select compatible hardware when quantization changes
  useEffect(() => {
    if (availableHardware.length > 0 && !availableHardware.find(hw => hw.value === hardware)) {
      setHardware(availableHardware[0].value);
    }
  }, [quantization, availableHardware, hardware]);

  useEffect(() => {
    if (availableReverseHardware.length > 0 && !availableReverseHardware.find(hw => hw.value === reverseHardware)) {
      setReverseHardware(availableReverseHardware[0].value);
    }
  }, [reverseQuantization, availableReverseHardware, reverseHardware]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
          LLM Performance & Capacity Planning
        </h2>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Calculate theoretical and realistic throughput, concurrent user capacity, and infrastructure requirements for Large Language Model deployments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8 border-b border-slate-200">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('performance')}
            className={cn(
              "px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2",
              activeTab === 'performance'
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            Performance Calculator
          </button>
          <button
            onClick={() => setActiveTab('capacity')}
            className={cn(
              "px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2",
              activeTab === 'capacity'
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            Capacity Planning
          </button>
        </div>
      </div>

      {/* Performance Calculator Tab */}
      {activeTab === 'performance' && (
        <PerformanceCalculator
          model={model}
          setModel={setModel}
          quantization={quantization}
          setQuantization={setQuantization}
          hardware={hardware}
          setHardware={setHardware}
          utilization={utilization}
          setUtilization={setUtilization}
          inputLength={inputLength}
          setInputLength={setInputLength}
          responseLength={responseLength}
          setResponseLength={setResponseLength}
          thinkTime={thinkTime}
          setThinkTime={setThinkTime}
          useKVCache={useKVCache}
          setUseKVCache={setUseKVCache}
          kvOffloading={kvOffloading}
          setKvOffloading={setKvOffloading}
          systemPromptTokens={systemPromptTokens}
          setSystemPromptTokens={setSystemPromptTokens}
          sessionHistoryTokens={sessionHistoryTokens}
          setSessionHistoryTokens={setSessionHistoryTokens}
          newInputTokens={newInputTokens}
          setNewInputTokens={setNewInputTokens}
          useMoeArchitecture={useMoeArchitecture}
          setUseMoeArchitecture={setUseMoeArchitecture}
          useCustomModel={useCustomModel}
          setUseCustomModel={setUseCustomModel}
          customTotalParams={customTotalParams}
          setCustomTotalParams={setCustomTotalParams}
          customActiveParams={customActiveParams}
          setCustomActiveParams={setCustomActiveParams}
          customTotalExperts={customTotalExperts}
          setCustomTotalExperts={setCustomTotalExperts}
          customActiveExperts={customActiveExperts}
          setCustomActiveExperts={setCustomActiveExperts}
          units={performanceUnits}
          setUnits={setPerformanceUnits}
          tokensPerSecPerUser={tokensPerSecPerUser}
          setTokensPerSecPerUser={setTokensPerSecPerUser}
          avgResponseTokensPerRequest={avgResponseTokensPerRequestPerf}
          setAvgResponseTokensPerRequest={setAvgResponseTokensPerRequestPerf}
          calcMode={calcMode}
          setCalcMode={setCalcMode}
          kernelEfficiency={kernelEfficiency}
          setKernelEfficiency={setKernelEfficiency}
          cpuAMXEfficiency={cpuAMXEfficiency}
          setCpuAMXEfficiency={setCpuAMXEfficiency}
          cpuUtilizationTarget={cpuUtilizationTarget}
          setCpuUtilizationTarget={setCpuUtilizationTarget}
          // Capacity parity props
          targetHeadroom={targetHeadroom}
          setTargetHeadroom={setTargetHeadroom}
          offloadRatio={offloadRatio}
          setOffloadRatio={setOffloadRatio}
          activeKvFraction={activeKvSessionFraction}
          setActiveKvFraction={setActiveKvSessionFraction}
          // Production & CPU parity
          useProductionFramework={useProductionFramework}
          setUseProductionFramework={setUseProductionFramework}
          utilizationFactor={utilizationFactor}
          setUtilizationFactor={setUtilizationFactor}
          attentionOverheadInput={attentionOverhead}
          setAttentionOverhead={setAttentionOverhead}
          prefillOverheadInput={prefillOverhead}
          setPrefillOverhead={setPrefillOverhead}
          cpuPrefillMultiplier={cpuPrefillMultiplier}
          setCpuPrefillMultiplier={setCpuPrefillMultiplier}
          cpuRedundancy={cpuRedundancy}
          setCpuRedundancy={setCpuRedundancy}
          cpuModelRamOverhead={cpuModelRamOverhead}
          setCpuModelRamOverhead={setCpuModelRamOverhead}
          results={performanceResults}
        />
      )}

      {/* Capacity Planning Tab */}
      {activeTab === 'capacity' && (
        <CapacityPlanner
          // Production-Grade Framework
          useProductionFramework={useProductionFramework}
          setUseProductionFramework={setUseProductionFramework}
          numUsers={numUsers}
          setNumUsers={setNumUsers}
          tokensPerSecPerUser={tokensPerSecPerUser}
          setTokensPerSecPerUser={setTokensPerSecPerUser}
          peakFlops={peakFlops}
          setPeakFlops={setPeakFlops}
          vramPerGpu={vramPerGpu}
          setVramPerGpu={setVramPerGpu}
          kernelEfficiency={kernelEfficiency}
          setKernelEfficiency={setKernelEfficiency}
          utilizationFactor={utilizationFactor}
          setUtilizationFactor={setUtilizationFactor}
          attentionOverhead={attentionOverhead}
          setAttentionOverhead={setAttentionOverhead}
          prefillOverhead={prefillOverhead}
          setPrefillOverhead={setPrefillOverhead}
          targetHeadroom={targetHeadroom}
          setTargetHeadroom={setTargetHeadroom}
          systemPromptTokensPG={systemPromptTokensPG}
          setSystemPromptTokensPG={setSystemPromptTokensPG}
          sessionHistoryTokensPG={sessionHistoryTokensPG}
          setSessionHistoryTokensPG={setSessionHistoryTokensPG}
          newInputTokensPerRequest={newInputTokensPerRequest}
          setNewInputTokensPerRequest={setNewInputTokensPerRequest}
          avgResponseTokensPerRequest={avgResponseTokensPerRequest}
          setAvgResponseTokensPerRequest={setAvgResponseTokensPerRequest}
          offloadRatio={offloadRatio}
          setOffloadRatio={setOffloadRatio}
          
          // Legacy fields
          model={reverseModel}
          setModel={setReverseModel}
          quantization={reverseQuantization}
          setQuantization={setReverseQuantization}
          hardware={reverseHardware}
          setHardware={setReverseHardware}
          users={reverseUsers}
          setUsers={setReverseUsers}
          inputLength={reverseInput}
          setInputLength={setReverseInput}
          tokensPerSec={reverseTokens}
          setTokensPerSec={setReverseTokens}
          utilization={reverseUtil}
          setUtilization={setReverseUtil}
          useKVCache={reverseUseKVCache}
          setUseKVCache={setReverseUseKVCache}
          kvOffloading={reverseKvOffloading}
          setKvOffloading={setReverseKvOffloading}
          kvOffloadingPercentage={reverseKvOffloadingPercentage}
          setKvOffloadingPercentage={setReverseKvOffloadingPercentage}
          systemPromptTokens={reverseSystemPromptTokens}
          setSystemPromptTokens={setReverseSystemPromptTokens}
          sessionHistoryTokens={reverseSessionHistoryTokens}
          setSessionHistoryTokens={setReverseSessionHistoryTokens}
          newInputTokens={reverseNewInputTokens}
          setNewInputTokens={setReverseNewInputTokens}
          useMoeArchitecture={useMoeArchitecture}
          setUseMoeArchitecture={setUseMoeArchitecture}
          useCustomModelReverse={useCustomModel}
          setUseCustomModelReverse={setUseCustomModel}
          customTotalParamsReverse={customTotalParams}
          setCustomTotalParamsReverse={setCustomTotalParams}
          customActiveParamsReverse={customActiveParams}
          setCustomActiveParamsReverse={setCustomActiveParams}
          customTotalExpertsReverse={customTotalExperts}
          setCustomTotalExpertsReverse={setCustomTotalExperts}
          customActiveExpertsReverse={customActiveExperts}
          setCustomActiveExpertsReverse={setCustomActiveExperts}
          // CPU / GPU mode & CPU config
          calcMode={calcMode}
          setCalcMode={setCalcMode}

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
          // Active KV session fraction
          activeKvFraction={activeKvSessionFraction}
          setActiveKvFraction={setActiveKvSessionFraction}
          results={capacityResults}
        />
      )}
    </div>
  );
}
