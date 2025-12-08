'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import InfoBox from '@/components/InfoBox';
import FooterSections from '@/components/FooterSections';
import PerformanceTable from '@/components/PerformanceTable';
import PerformanceChart from '@/components/PerformanceChart';
import AdvancedCalculator from '@/components/AdvancedCalculator';
import { QuantizationType, HardwareType, MetricType } from '@/lib/types';
import { speedBoosts, qualityImpact, quantSpec } from '@/lib/constants';
import { hardwareDatabase } from '@/lib/hardwareDatabase';
import { QUANTIZATION_OPTIONS, getHardwareFamily, HARDWARE_FAMILIES } from '@/lib/config';

export default function CombinedViewerPage() {
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
      
      <div className="py-10 px-12">
        <InfoBox>
          <div>
            <strong>Performance Impact:</strong> Current configuration uses <span className="font-bold text-blue-800">{quantization.toUpperCase()}</span> quantization, 
            providing <strong className="font-bold text-blue-800">{speedBoosts[quantization]}</strong> throughput boost and reducing VRAM usage to <strong className="font-bold text-blue-800">{(quantSpec[quantization] * 100).toFixed(0)}%</strong> of FP16 baseline, 
            with <strong className="font-bold text-blue-800">{qualityImpact[quantization]}</strong>.
          </div>
        </InfoBox>

        {/* View Toggle */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setActiveView('table')}
            className={`px-6 py-3 mx-2.5 border-2 rounded-lg cursor-pointer text-base font-semibold transition-all duration-300 ${
              activeView === 'table'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white border-slate-300 hover:border-blue-500'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setActiveView('chart')}
            className={`px-6 py-3 mx-2.5 border-2 rounded-lg cursor-pointer text-base font-semibold transition-all duration-300 ${
              activeView === 'chart'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white border-slate-300 hover:border-blue-500'
            }`}
          >
            Chart View
          </button>
          <button
            onClick={() => setActiveView('calculator')}
            className={`px-6 py-3 mx-2.5 border-2 rounded-lg cursor-pointer text-base font-semibold transition-all duration-300 ${
              activeView === 'calculator'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white border-slate-300 hover:border-blue-500'
            }`}
          >
            Performance Calculator
          </button>
        </div>

        {/* Configuration Controls */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-200 border-2 border-slate-300 p-8 mb-8 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-blue-900 mb-5">Configuration Settings</h2>
          <div className={`grid gap-6 ${activeView === 'chart' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
            <div>
              <label className="block font-semibold mb-2 text-slate-800 text-sm uppercase tracking-wide">
                Hardware Configuration
              </label>
              <select 
                value={hardware}
                onChange={(e) => setHardware(e.target.value as HardwareType)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-sm bg-white cursor-pointer transition-all duration-300 hover:border-blue-500 focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] font-medium"
              >
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
            <div>
              <label className="block font-semibold mb-2 text-slate-800 text-sm uppercase tracking-wide">
                Quantization Level
              </label>
              <select 
                value={quantization}
                onChange={(e) => setQuantization(e.target.value as QuantizationType)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-sm bg-white cursor-pointer transition-all duration-300 hover:border-blue-500 focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] font-medium"
              >
                <option value="fp16">FP16 (Full Precision - Highest Quality)</option>
                <option value="int8">INT8 (Balanced - Good Quality)</option>
                <option value="q4_k_s">Q4_K_S (Optimized - CPU Compatible)</option>
                <option value="int4">INT4 (Optimized - Best Performance)</option>
              </select>
            </div>
            {activeView === 'chart' && (
              <div>
                <label className="block font-semibold mb-2 text-slate-800 text-sm uppercase tracking-wide">
                  Metric to Display (Chart)
                </label>
                <select 
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as MetricType)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-sm bg-white cursor-pointer transition-all duration-300 hover:border-blue-500 focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] font-medium"
                >
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

        {/* View Content */}
        {activeView === 'table' && (
          <div>
            <PerformanceTable quantization={quantization} hardware={hardware} metric={metric} />
          </div>
        )}

        {activeView === 'chart' && (
          <div>
            <PerformanceChart quantization={quantization} hardware={hardware} metric={metric} />
          </div>
        )}

        {activeView === 'calculator' && (
          <div>
            <AdvancedCalculator />
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
      </div>
    </>
  );
}
