'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import InfoBox from '@/components/InfoBox';
import PerformanceCalculator from '@/components/PerformanceCalculator';
import CapacityPlanner from '@/components/CapacityPlanner';
import FooterSections from '@/components/FooterSections';
import { QuantizationType, HardwareType } from '@/lib/types';
import { speedBoosts, qualityImpact, quantSpec } from '@/lib/constants';
import { useCapacityCalculation } from '@/hooks/useCapacityCalculation';
import { usePerformanceCalculation } from '@/hooks/usePerformanceCalculation';
import { cn } from '@/lib/utils';

export default function Home() {
  const [activeView, setActiveView] = useState<'performance' | 'capacity'>('performance');

  // Performance Calculator State
  const [perfModel, setPerfModel] = useState('7');
  const [perfQuantization, setPerfQuantization] = useState<QuantizationType>('int4');
  const [perfHardware, setPerfHardware] = useState<HardwareType>('h100-3958,int8');
  const [perfUtilization, setPerfUtilization] = useState(0.8);
  const [perfInputLength, setPerfInputLength] = useState(512);
  const [perfResponseLength, setPerfResponseLength] = useState(128);
  const [perfThinkTime, setPerfThinkTime] = useState(5);
  const [perfUseKVCache, setPerfUseKVCache] = useState(true);
  const [perfKvOffloading, setPerfKvOffloading] = useState(false);
  const [perfSystemPromptTokens, setPerfSystemPromptTokens] = useState(500);
  const [perfSessionHistoryTokens, setPerfSessionHistoryTokens] = useState(2000);
  const [perfNewInputTokens, setPerfNewInputTokens] = useState(512);
  const [perfUseMoeArchitecture, setPerfUseMoeArchitecture] = useState(false);
  const [perfUseCustomModel, setPerfUseCustomModel] = useState(false);
  const [perfCustomTotalParams, setPerfCustomTotalParams] = useState(70);
  const [perfCustomActiveParams, setPerfCustomActiveParams] = useState(70);
  const [perfCustomTotalExperts, setPerfCustomTotalExperts] = useState(8);
  const [perfCustomActiveExperts, setPerfCustomActiveExperts] = useState(2);
  const [perfTokensPerSecPerUser, setPerfTokensPerSecPerUser] = useState(10);
  const [perfUnits, setPerfUnits] = useState(1);
  const [perfAvgResponseTokens, setPerfAvgResponseTokens] = useState(50);
  const [perfUseProductionFramework, setPerfUseProductionFramework] = useState(true);
  const [perfKernelEfficiency, setPerfKernelEfficiency] = useState(0.5);
  const [perfUtilizationFactor, setPerfUtilizationFactor] = useState(0.8);
  const [perfAttentionOverhead, setPerfAttentionOverhead] = useState(0.1);
  const [perfPrefillOverhead, setPerfPrefillOverhead] = useState(0.1);
  const [perfCpuPrefillMultiplier, setPerfCpuPrefillMultiplier] = useState(1.5);
  const [perfCpuRedundancy, setPerfCpuRedundancy] = useState(0.1);
  const [perfCpuModelRamOverhead, setPerfCpuModelRamOverhead] = useState(0.2);
  const [perfCpuUtilizationTarget, setPerfCpuUtilizationTarget] = useState(0.8);
  const [perfCpuAMXEfficiency, setPerfCpuAMXEfficiency] = useState(0.5);
  const [perfCalcMode, setPerfCalcMode] = useState<'cpu' | 'gpu'>('gpu');
  const [perfOffloadRatio, setPerfOffloadRatio] = useState(0);

  // Capacity Planner State
  const [capNumUsers, setCapNumUsers] = useState(100);
  const [capTokensPerSecPerUser, setCapTokensPerSecPerUser] = useState(10);
  const [capPeakFlops, setCapPeakFlops] = useState(1e15);
  const [capVramPerGpu, setCapVramPerGpu] = useState(96);
  const [capKernelEfficiency, setCapKernelEfficiency] = useState(0.5);
  const [capUtilizationFactor, setCapUtilizationFactor] = useState(0.8);
  const [capAttentionOverhead, setCapAttentionOverhead] = useState(0.1);
  const [capPrefillOverhead, setCapPrefillOverhead] = useState(0.1);
  const [capTargetHeadroom, setCapTargetHeadroom] = useState(0.1);
  const [capSystemPromptTokensPG, setCapSystemPromptTokensPG] = useState(0);
  const [capSessionHistoryTokensPG, setCapSessionHistoryTokensPG] = useState(0);
  const [capNewInputTokensPerRequest, setCapNewInputTokensPerRequest] = useState(100);
  const [capAvgResponseTokensPerRequest, setCapAvgResponseTokensPerRequest] = useState(50);
  const [capOffloadRatio, setCapOffloadRatio] = useState(0);
  const [capModel, setCapModel] = useState('7');
  const [capQuantization, setCapQuantization] = useState<QuantizationType>('int4');
  const [capHardware, setCapHardware] = useState<HardwareType>('h100-3958,int8');
  const [capUsers, setCapUsers] = useState(100);
  const [capInputLength, setCapInputLength] = useState(512);
  const [capTokensPerSec, setCapTokensPerSec] = useState(10);
  const [capUtilization, setCapUtilization] = useState(0.8);
  const [capUseKVCache, setCapUseKVCache] = useState(false);
  const [capKvOffloading, setCapKvOffloading] = useState(false);
  const [capKvOffloadingPercentage, setCapKvOffloadingPercentage] = useState(100);
  const [capSystemPromptTokens, setCapSystemPromptTokens] = useState(500);
  const [capSessionHistoryTokens, setCapSessionHistoryTokens] = useState(2000);
  const [capNewInputTokens, setCapNewInputTokens] = useState(512);
  const [capUseMoeArchitecture, setCapUseMoeArchitecture] = useState(false);
  const [capUseCustomModel, setCapUseCustomModel] = useState(false);
  const [capCustomTotalParams, setCapCustomTotalParams] = useState(70);
  const [capCustomActiveParams, setCapCustomActiveParams] = useState(70);
  const [capCustomTotalExperts, setCapCustomTotalExperts] = useState(8);
  const [capCustomActiveExperts, setCapCustomActiveExperts] = useState(2);
  const [capCpuPrefillMultiplier, setCapCpuPrefillMultiplier] = useState(1.5);
  const [capCpuUtilizationTarget, setCapCpuUtilizationTarget] = useState(0.8);
  const [capCpuRedundancy, setCapCpuRedundancy] = useState(0.1);
  const [capCpuAMXEfficiency, setCapCpuAMXEfficiency] = useState(0.5);
  const [capCpuModelRamOverhead, setCapCpuModelRamOverhead] = useState(0.2);
  const [capActiveKvFraction, setCapActiveKvFraction] = useState(0.05);
  const [capUseProductionFramework, setCapUseProductionFramework] = useState(true);
  const [capCalcMode, setCapCalcMode] = useState<'cpu' | 'gpu'>('gpu');

  // Capacity calculation hook
  const capacityResults = useCapacityCalculation({
    useProductionFramework: capUseProductionFramework,
    numUsers: capNumUsers,
    tokensPerSecPerUser: capTokensPerSecPerUser,
    peakFlops: capPeakFlops,
    vramPerGpu: capVramPerGpu,
    kernelEfficiency: capKernelEfficiency,
    utilizationFactor: capUtilizationFactor,
    attentionOverhead: capAttentionOverhead,
    prefillOverhead: capPrefillOverhead,
    targetHeadroom: capTargetHeadroom,
    systemPromptTokensPG: capSystemPromptTokensPG,
    sessionHistoryTokensPG: capSessionHistoryTokensPG,
    newInputTokensPerRequest: capNewInputTokensPerRequest,
    avgResponseTokensPerRequest: capAvgResponseTokensPerRequest,
    offloadRatio: capOffloadRatio,
    model: capModel,
    quantization: capQuantization,
    hardware: capHardware,
    users: capUsers,
    inputLength: capInputLength,
    tokensPerSec: capTokensPerSec,
    utilization: capUtilization,
    useKVCache: capUseKVCache,
    kvOffloading: capKvOffloading,
    kvOffloadingPercentage: capKvOffloadingPercentage,
    systemPromptTokens: capSystemPromptTokens,
    sessionHistoryTokens: capSessionHistoryTokens,
    newInputTokens: capNewInputTokens,
    useMoeArchitecture: capUseMoeArchitecture,
    useCustomModel: capUseCustomModel,
    customTotalParams: capCustomTotalParams,
    customActiveParams: capCustomActiveParams,
    customTotalExperts: capCustomTotalExperts,
    customActiveExperts: capCustomActiveExperts,
    cpuPrefillMultiplier: capCpuPrefillMultiplier,
    cpuUtilizationTarget: capCpuUtilizationTarget,
    cpuRedundancy: capCpuRedundancy,
    cpuAMXEfficiency: capCpuAMXEfficiency,
    cpuModelRamOverhead: capCpuModelRamOverhead,
    activeKvFraction: capActiveKvFraction,
  });

  // Performance calculation hook
  const performanceResults = usePerformanceCalculation({
    model: perfModel,
    hardware: perfHardware,
    utilization: perfUtilization,
    inputLength: perfInputLength,
    responseLength: perfResponseLength,
    thinkTime: perfThinkTime,
    useKVCache: perfUseKVCache,
    kvOffloading: perfKvOffloading,
    systemPromptTokens: perfSystemPromptTokens,
    sessionHistoryTokens: perfSessionHistoryTokens,
    newInputTokens: perfNewInputTokens,
    useMoeArchitecture: perfUseMoeArchitecture,
    useCustomModel: perfUseCustomModel,
    customTotalParams: perfCustomTotalParams,
    customActiveParams: perfCustomActiveParams,
    customTotalExperts: perfCustomTotalExperts,
    customActiveExperts: perfCustomActiveExperts,
    units: perfUnits,
    avgResponseTokensPerRequest: perfAvgResponseTokens,
    tokensPerSecPerUser: perfTokensPerSecPerUser,
    isCPU: perfCalcMode === 'cpu',
    kernelEfficiency: perfKernelEfficiency,
    cpuAMXEfficiency: perfCpuAMXEfficiency,
    cpuUtilizationTarget: perfCpuUtilizationTarget,
    useProductionFramework: perfUseProductionFramework,
    utilizationFactor: perfUtilizationFactor,
    attentionOverhead: perfAttentionOverhead,
    prefillOverhead: perfPrefillOverhead,
    cpuPrefillMultiplier: perfCpuPrefillMultiplier,
    cpuRedundancy: perfCpuRedundancy,
    cpuModelRamOverhead: perfCpuModelRamOverhead,
    offloadRatio: perfOffloadRatio
  });

  return (
    <>
      <Header
        title="LLM Infrastructure & Performance Calculator"
        subtitle="A production-grade web application for modeling and visualizing Large Language Model (LLM) inference performance across GPUs, quantization levels, and deployment scenarios."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-inner">
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                activeView === 'performance'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
              onClick={() => setActiveView('performance')}
            >
              Performance Calculator
            </button>
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                activeView === 'capacity'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
              onClick={() => setActiveView('capacity')}
            >
              Capacity Planner
            </button>
          </div>
        </div>

        {activeView === 'performance' && (
          <div className="view-section">
            <PerformanceCalculator
              model={perfModel}
              setModel={setPerfModel}
              quantization={perfQuantization}
              setQuantization={(value: string) => setPerfQuantization(value as QuantizationType)}
              hardware={perfHardware}
              setHardware={(value: string) => setPerfHardware(value)}
              utilization={perfUtilization}
              setUtilization={setPerfUtilization}
              inputLength={perfInputLength}
              setInputLength={setPerfInputLength}
              responseLength={perfResponseLength}
              setResponseLength={setPerfResponseLength}
              thinkTime={perfThinkTime}
              setThinkTime={setPerfThinkTime}
              useKVCache={perfUseKVCache}
              setUseKVCache={setPerfUseKVCache}
              kvOffloading={perfKvOffloading}
              setKvOffloading={setPerfKvOffloading}
              systemPromptTokens={perfSystemPromptTokens}
              setSystemPromptTokens={setPerfSystemPromptTokens}
              sessionHistoryTokens={perfSessionHistoryTokens}
              setSessionHistoryTokens={setPerfSessionHistoryTokens}
              newInputTokens={perfNewInputTokens}
              setNewInputTokens={setPerfNewInputTokens}
              useMoeArchitecture={perfUseMoeArchitecture}
              setUseMoeArchitecture={setPerfUseMoeArchitecture}
              useCustomModel={perfUseCustomModel}
              setUseCustomModel={setPerfUseCustomModel}
              customTotalParams={perfCustomTotalParams}
              setCustomTotalParams={setPerfCustomTotalParams}
              customActiveParams={perfCustomActiveParams}
              setCustomActiveParams={setPerfCustomActiveParams}
              customTotalExperts={perfCustomTotalExperts}
              setCustomTotalExperts={setPerfCustomTotalExperts}
              customActiveExperts={perfCustomActiveExperts}
              setCustomActiveExperts={setPerfCustomActiveExperts}
              tokensPerSecPerUser={perfTokensPerSecPerUser}
              setTokensPerSecPerUser={setPerfTokensPerSecPerUser}
              units={perfUnits}
              setUnits={setPerfUnits}
              avgResponseTokensPerRequest={perfAvgResponseTokens}
              setAvgResponseTokensPerRequest={setPerfAvgResponseTokens}
              useProductionFramework={perfUseProductionFramework}
              setUseProductionFramework={setPerfUseProductionFramework}
              kernelEfficiency={perfKernelEfficiency}
              setKernelEfficiency={setPerfKernelEfficiency}
              utilizationFactor={perfUtilizationFactor}
              setUtilizationFactor={setPerfUtilizationFactor}
              attentionOverhead={perfAttentionOverhead}
              setAttentionOverhead={setPerfAttentionOverhead}
              prefillOverhead={perfPrefillOverhead}
              setPrefillOverhead={setPerfPrefillOverhead}
              cpuPrefillMultiplier={perfCpuPrefillMultiplier}
              setCpuPrefillMultiplier={setPerfCpuPrefillMultiplier}
              cpuRedundancy={perfCpuRedundancy}
              setCpuRedundancy={setPerfCpuRedundancy}
              cpuModelRamOverhead={perfCpuModelRamOverhead}
              setCpuModelRamOverhead={setPerfCpuModelRamOverhead}
              cpuUtilizationTarget={perfCpuUtilizationTarget}
              setCpuUtilizationTarget={setPerfCpuUtilizationTarget}
              cpuAMXEfficiency={perfCpuAMXEfficiency}
              setCpuAMXEfficiency={setPerfCpuAMXEfficiency}
              calcMode={perfCalcMode}
              setCalcMode={setPerfCalcMode}
              offloadRatio={perfOffloadRatio}
              setOffloadRatio={setPerfOffloadRatio}
              results={performanceResults}
            />
          </div>
        )}

        {activeView === 'capacity' && (
          <div className="view-section">
            <CapacityPlanner
              numUsers={capNumUsers}
              setNumUsers={setCapNumUsers}
              tokensPerSecPerUser={capTokensPerSecPerUser}
              setTokensPerSecPerUser={setCapTokensPerSecPerUser}
              peakFlops={capPeakFlops}
              setPeakFlops={setCapPeakFlops}
              vramPerGpu={capVramPerGpu}
              setVramPerGpu={setCapVramPerGpu}
              kernelEfficiency={capKernelEfficiency}
              setKernelEfficiency={setCapKernelEfficiency}
              utilizationFactor={capUtilizationFactor}
              setUtilizationFactor={setCapUtilizationFactor}
              attentionOverhead={capAttentionOverhead}
              setAttentionOverhead={setCapAttentionOverhead}
              prefillOverhead={capPrefillOverhead}
              setPrefillOverhead={setCapPrefillOverhead}
              targetHeadroom={capTargetHeadroom}
              setTargetHeadroom={setCapTargetHeadroom}
              systemPromptTokensPG={capSystemPromptTokensPG}
              setSystemPromptTokensPG={setCapSystemPromptTokensPG}
              sessionHistoryTokensPG={capSessionHistoryTokensPG}
              setSessionHistoryTokensPG={setCapSessionHistoryTokensPG}
              newInputTokensPerRequest={capNewInputTokensPerRequest}
              setNewInputTokensPerRequest={setCapNewInputTokensPerRequest}
              avgResponseTokensPerRequest={capAvgResponseTokensPerRequest}
              setAvgResponseTokensPerRequest={setCapAvgResponseTokensPerRequest}
              offloadRatio={capOffloadRatio}
              setOffloadRatio={setCapOffloadRatio}
              model={capModel}
              setModel={setCapModel}
              quantization={capQuantization}
              setQuantization={(value: string) => setCapQuantization(value as QuantizationType)}
              hardware={capHardware}
              setHardware={(value: string) => setCapHardware(value)}
              users={capUsers}
              setUsers={setCapUsers}
              inputLength={capInputLength}
              setInputLength={setCapInputLength}
              tokensPerSec={capTokensPerSec}
              setTokensPerSec={setCapTokensPerSec}
              utilization={capUtilization}
              setUtilization={setCapUtilization}
              useKVCache={capUseKVCache}
              setUseKVCache={setCapUseKVCache}
              kvOffloading={capKvOffloading}
              setKvOffloading={setCapKvOffloading}
              kvOffloadingPercentage={capKvOffloadingPercentage}
              setKvOffloadingPercentage={setCapKvOffloadingPercentage}
              systemPromptTokens={capSystemPromptTokens}
              setSystemPromptTokens={setCapSystemPromptTokens}
              sessionHistoryTokens={capSessionHistoryTokens}
              setSessionHistoryTokens={setCapSessionHistoryTokens}
              newInputTokens={capNewInputTokens}
              setNewInputTokens={setCapNewInputTokens}
              useMoeArchitecture={capUseMoeArchitecture}
              setUseMoeArchitecture={setCapUseMoeArchitecture}
              useCustomModelReverse={capUseCustomModel}
              setUseCustomModelReverse={setCapUseCustomModel}
              customTotalParamsReverse={capCustomTotalParams}
              setCustomTotalParamsReverse={setCapCustomTotalParams}
              customActiveParamsReverse={capCustomActiveParams}
              setCustomActiveParamsReverse={setCapCustomActiveParams}
              customTotalExpertsReverse={capCustomTotalExperts}
              setCustomTotalExpertsReverse={setCapCustomTotalExperts}
              customActiveExpertsReverse={capCustomActiveExperts}
              setCustomActiveExpertsReverse={setCapCustomActiveExperts}
              cpuPrefillMultiplier={capCpuPrefillMultiplier}
              setCpuPrefillMultiplier={setCapCpuPrefillMultiplier}
              cpuUtilizationTarget={capCpuUtilizationTarget}
              setCpuUtilizationTarget={setCapCpuUtilizationTarget}
              cpuRedundancy={capCpuRedundancy}
              setCpuRedundancy={setCapCpuRedundancy}
              cpuAMXEfficiency={capCpuAMXEfficiency}
              setCpuAMXEfficiency={setCapCpuAMXEfficiency}
              cpuModelRamOverhead={capCpuModelRamOverhead}
              setCpuModelRamOverhead={setCapCpuModelRamOverhead}
              activeKvFraction={capActiveKvFraction}
              setActiveKvFraction={setCapActiveKvFraction}
              useProductionFramework={capUseProductionFramework}
              setUseProductionFramework={setCapUseProductionFramework}
              calcMode={capCalcMode}
              setCalcMode={setCapCalcMode}
              results={capacityResults}
            />
          </div>
        )}

        <FooterSections />

        <InfoBox type="warning">
          <div>
            <strong>Important Considerations:</strong> Actual performance varies based on model architecture specifics, prompt complexity,
            request patterns, hardware capabilities, and concurrent load. These benchmarks represent typical scenarios under controlled
            conditions. Always conduct your own testing with representative workloads before production deployment.
          </div>
        </InfoBox>
        <div className="copyright-notice" style={{
          textAlign: 'center',
          padding: '20px',
          marginTop: '20px',
          borderTop: '1px solid #e5e7eb',
          color: '#6b7280',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          © 2025 Finovate Team. All rights reserved.
        </div>
      </div>
    </>
  );
}
