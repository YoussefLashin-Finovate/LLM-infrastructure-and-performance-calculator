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

  // Capacity Planner State
  const [reverseModel, setReverseModel] = useState(DEFAULT_VALUES.capacity.model);
  const [reverseQuantization, setReverseQuantization] = useState(DEFAULT_VALUES.capacity.quantization);
  const [reverseUsers, setReverseUsers] = useState(DEFAULT_VALUES.capacity.users);
  const [reverseInput, setReverseInput] = useState(DEFAULT_VALUES.capacity.inputLength);
  const [reverseTokens, setReverseTokens] = useState(DEFAULT_VALUES.capacity.tokensPerSec);
  const [reverseHardware, setReverseHardware] = useState(DEFAULT_VALUES.capacity.hardware);
  const [reverseUtil, setReverseUtil] = useState(DEFAULT_VALUES.capacity.utilization);

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
  });

  const capacityResults = useCapacityCalculation({
    model: reverseModel,
    hardware: reverseHardware,
    quantization: reverseQuantization,
    users: reverseUsers,
    inputLength: reverseInput,
    tokensPerSec: reverseTokens,
    utilization: reverseUtil,
  });

  // Hardware filtering hooks
  const { available: availableHardware } = useHardwareFilter(quantization);
  const { available: availableReverseHardware } = useHardwareFilter(reverseQuantization);



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
          results={capacityResults}
        />
      )}
    </div>
  );
}
