'use client';

import { useState, useEffect } from 'react';
import PerformanceCalculator from './PerformanceCalculator';
import CapacityPlanner from './CapacityPlanner';
import { usePerformanceCalculation } from '@/hooks/usePerformanceCalculation';
import { useCapacityCalculation } from '@/hooks/useCapacityCalculation';
import { useHardwareFilter } from '@/hooks/useHardwareFilter';
import { DEFAULT_VALUES, UI_CONFIG } from '@/lib/config';

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
  
  // KV Cache toggle and token breakdown for reverse
  const [reverseUseKVCache, setReverseUseKVCache] = useState(false);
  const [reverseKvOffloading, setReverseKvOffloading] = useState(false);
  const [reverseKvOffloadingPercentage, setReverseKvOffloadingPercentage] = useState(100);
  const [reverseSystemPromptTokens, setReverseSystemPromptTokens] = useState(500);
  const [reverseSessionHistoryTokens, setReverseSessionHistoryTokens] = useState(2000);
  const [reverseNewInputTokens, setReverseNewInputTokens] = useState(512);
  
  // MoE Architecture Toggle for reverse
  const [reverseUseMoeArchitecture, setReverseUseMoeArchitecture] = useState(false);
  
  // Custom Model Configuration for reverse
  const [reverseUseCustomModel, setReverseUseCustomModel] = useState(false);
  const [reverseCustomTotalParams, setReverseCustomTotalParams] = useState(70);
  const [reverseCustomActiveParams, setReverseCustomActiveParams] = useState(70);
  const [reverseCustomTotalExperts, setReverseCustomTotalExperts] = useState(8);
  const [reverseCustomActiveExperts, setReverseCustomActiveExperts] = useState(2);

  // UI State
  const [activeTab, setActiveTab] = useState<'performance' | 'capacity'>('performance');

  // Use custom hooks for calculations
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
  });

  // Calculation mode (auto / cpu / gpu)
  const [calcMode, setCalcMode] = useState<'auto'|'cpu'|'gpu'>('auto');
  const [cpuTps, setCpuTps] = useState<number>(8);
  const [cpuPrefillMultiplier, setCpuPrefillMultiplier] = useState<number>(2.5);
  const [cpuUtilizationTarget, setCpuUtilizationTarget] = useState<number>(0.65);
  const [cpuRedundancy, setCpuRedundancy] = useState<number>(1.15);
  const [cpuAMXEfficiency, setCpuAMXEfficiency] = useState<number>(0.2);
  const [cpuModelRamOverhead, setCpuModelRamOverhead] = useState<number>(1.2);



  const capacityResults = useCapacityCalculation({
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
    useMoeArchitecture: reverseUseMoeArchitecture,
    useCustomModel: reverseUseCustomModel,
    customTotalParams: reverseCustomTotalParams,
    customActiveParams: reverseCustomActiveParams,
    customTotalExperts: reverseCustomTotalExperts,
    customActiveExperts: reverseCustomActiveExperts,
    // Forward CPU overrides
    cpuTps,
    cpuPrefillMultiplier,
    cpuUtilizationTarget,
    cpuRedundancy,
    cpuAMXEfficiency,
    cpuModelRamOverhead,
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
    <div className="calculator-panel">
      <div style={{ textAlign: 'center', marginBottom: UI_CONFIG.spacing.sectionGap }}>
        <h2 style={{ 
          color: UI_CONFIG.colors.primary,
          marginBottom: '16px', 
          fontSize: UI_CONFIG.typography.headingSize,
          fontWeight: '800',
          letterSpacing: '-0.5px',
          lineHeight: '1.2'
        }}>
          {UI_CONFIG.icons.performance} LLM Performance & Capacity Planning
        </h2>
        <p style={{ 
          color: UI_CONFIG.colors.secondary,
          fontSize: UI_CONFIG.typography.bodySize,
          maxWidth: '900px', 
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Calculate theoretical and realistic throughput, concurrent user capacity, and infrastructure requirements for Large Language Model deployments
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '36px', 
        borderBottom: `3px solid ${UI_CONFIG.colors.border}`,
        paddingBottom: '0',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setActiveTab('performance')}
          style={{
            padding: '14px 32px',
            border: 'none',
            borderBottom: activeTab === 'performance' ? `4px solid ${UI_CONFIG.colors.primaryLight}` : '4px solid transparent',
            background: activeTab === 'performance' ? UI_CONFIG.colors.primaryBgGradient : 'transparent',
            color: activeTab === 'performance' ? UI_CONFIG.colors.primary : UI_CONFIG.colors.secondary,
            fontWeight: '700',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: '-3px',
            borderRadius: '8px 8px 0 0',
            boxShadow: activeTab === 'performance' ? `0 -2px 8px rgba(16, 185, 129, 0.1)` : 'none'
          }}
        >
          {UI_CONFIG.icons.chart} Performance Calculator
        </button>
        <button
          onClick={() => setActiveTab('capacity')}
          style={{
            padding: '14px 32px',
            border: 'none',
            borderBottom: activeTab === 'capacity' ? `4px solid ${UI_CONFIG.colors.primaryLight}` : '4px solid transparent',
            background: activeTab === 'capacity' ? UI_CONFIG.colors.primaryBgGradient : 'transparent',
            color: activeTab === 'capacity' ? UI_CONFIG.colors.primary : UI_CONFIG.colors.secondary,
            fontWeight: '700',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: '-3px',
            borderRadius: '8px 8px 0 0',
            boxShadow: activeTab === 'capacity' ? `0 -2px 8px rgba(16, 185, 129, 0.1)` : 'none'
          }}
        >
          {UI_CONFIG.icons.capacity} Capacity Planning
        </button>
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
          results={performanceResults}
        />
      )}

      {/* Capacity Planning Tab */}
      {activeTab === 'capacity' && (
        <CapacityPlanner
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
          useMoeArchitecture={reverseUseMoeArchitecture}
          setUseMoeArchitecture={setReverseUseMoeArchitecture}
          useCustomModelReverse={reverseUseCustomModel}
          setUseCustomModelReverse={setReverseUseCustomModel}
          customTotalParamsReverse={reverseCustomTotalParams}
          setCustomTotalParamsReverse={setReverseCustomTotalParams}
          customActiveParamsReverse={reverseCustomActiveParams}
          setCustomActiveParamsReverse={setReverseCustomActiveParams}
          customTotalExpertsReverse={reverseCustomTotalExperts}
          setCustomTotalExpertsReverse={setReverseCustomTotalExperts}
          customActiveExpertsReverse={reverseCustomActiveExperts}
          setCustomActiveExpertsReverse={setReverseCustomActiveExperts}
          // CPU / GPU mode & CPU config
          calcMode={calcMode}
          setCalcMode={setCalcMode}
          cpuTps={cpuTps}
          setCpuTps={setCpuTps}
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
          results={capacityResults}
        />
      )}
    </div>
  );
}
