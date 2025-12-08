'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import InfoBox from '@/components/InfoBox';
import PerformanceTable from '@/components/PerformanceTable';
import PerformanceChart from '@/components/PerformanceChart';
import AdvancedCalculator from '@/components/AdvancedCalculator';
import FooterSections from '@/components/FooterSections';
import { QuantizationType, HardwareType, MetricType } from '@/lib/types';
import { speedBoosts, qualityImpact, quantSpec } from '@/lib/constants';
import { hardwareDatabase } from '@/lib/hardwareDatabase';
import { QUANTIZATION_OPTIONS, getHardwareFamily, HARDWARE_FAMILIES } from '@/lib/config';

export default function Home() {
  const [hardware, setHardware] = useState<HardwareType>('h100-3958,int8'); // H100 INT8 as default
  const [quantization, setQuantization] = useState<QuantizationType>('int4');
  const [metric, setMetric] = useState<MetricType>('batch');
  const [activeView, setActiveView] = useState<'table' | 'chart' | 'calculator'>('table');

  return (
    <>
      <Header 
        title="LLM Inference Performance Reference"
        subtitle="Enterprise-grade performance metrics for Arabic-capable and general-purpose language models<br>Comprehensive benchmarks for models under 70B parameters with real-world deployment insights"
      />
      
      <div className="content-wrapper">
        <div className="view-toggle">
          <button 
            className={activeView === 'table' ? 'active' : ''}
            onClick={() => setActiveView('table')}
          >
            Table View
          </button>
          <button 
            className={activeView === 'chart' ? 'active' : ''}
            onClick={() => setActiveView('chart')}
          >
            Chart View
          </button>
          <button 
            className={activeView === 'calculator' ? 'active' : ''}
            onClick={() => setActiveView('calculator')}
          >
            Performance Calculator
          </button>
        </div>

        {activeView !== 'calculator' && (
          <div className="controls">
            <h2>Configuration Settings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: activeView === 'chart' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '24px' }}>
              <div className="control-group">
                <label htmlFor="hardware">Hardware Configuration</label>
                <select id="hardware" value={hardware} onChange={(e) => setHardware(e.target.value as HardwareType)}>
                  {(() => {
                    // Group hardware by family
                    const groups: { [key: string]: typeof hardwareDatabase } = {};
                    hardwareDatabase.forEach(hw => {
                      const family = getHardwareFamily(hw.name);
                      if (!groups[family]) groups[family] = [];
                      groups[family].push(hw);
                    });
                    
                    return HARDWARE_FAMILIES.map(family => {
                      if (!groups[family]) return null;
                      return (
                        <optgroup key={family} label={family}>
                          {groups[family].map((hw, idx) => (
                            <option key={idx} value={hw.value}>
                              {hw.name} - {hw.memory}GB
                            </option>
                          ))}
                        </optgroup>
                      );
                    });
                  })()}
                </select>
              </div>
            <div className="control-group">
              <label htmlFor="quantization">Quantization Level</label>
              <select id="quantization" value={quantization} onChange={(e) => setQuantization(e.target.value as QuantizationType)}>
                <option value="fp16">FP16 (Full Precision - Highest Quality)</option>
                <option value="int8">INT8 (Balanced - Good Quality)</option>
                <option value="q4_k_s">Q4_K_S (Optimized - CPU Compatible)</option>
                <option value="int4">INT4 (Optimized - Best Performance)</option>
              </select>
            </div>
            {activeView === 'chart' && (
              <div className="control-group">
                <label htmlFor="metric">Metric to Display (Chart)</label>
                <select id="metric" value={metric} onChange={(e) => setMetric(e.target.value as MetricType)}>
                  <option value="ttft">TTFT (ms)</option>
                  <option value="latency">Latency (ms)</option>
                  <option value="users">Concurrent Users</option>
                  <option value="batch">Batch Size</option>
                  <option value="vram">VRAM/RAM (GB)</option>
                  <option value="context">Context Window</option>
                </select>
              </div>
            )}
          </div>
        </div>
        )}

        {activeView !== 'calculator' && (
          <InfoBox 
            quantization={quantization}
            speedBoost={speedBoosts[quantization]}
            vramReduction={(quantSpec[quantization] * 100).toFixed(0) + '%'}
            qualityImpact={qualityImpact[quantization]}
          />
        )}

        {activeView === 'table' && (
          <div className="view-section">
            <PerformanceTable quantization={quantization} hardware={hardware} metric={metric} />
          </div>
        )}

        {activeView === 'chart' && (
          <div className="view-section">
            <PerformanceChart quantization={quantization} hardware={hardware} metric={metric} />
          </div>
        )}

        {activeView === 'calculator' && (
          <div className="view-section">
            <AdvancedCalculator />
          </div>
        )}

        <FooterSections />

        <div className="warning-box">
          <div>
            <strong>Important Considerations:</strong> Actual performance varies based on model architecture specifics, prompt complexity, 
            request patterns, hardware capabilities, and concurrent load. These benchmarks represent typical scenarios under controlled 
            conditions. Always conduct your own testing with representative workloads before production deployment.
          </div>
        </div>
      </div>
    </>
  );
}
