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
import { cn } from '@/lib/utils';

export default function Home() {
  const [hardware, setHardware] = useState<HardwareType>('h100-3958,int8'); // H100 INT8 as default
  const [quantization, setQuantization] = useState<QuantizationType>('int4');
  const [metric, setMetric] = useState<MetricType>('batch');
  const [activeView, setActiveView] = useState<'table' | 'chart' | 'calculator'>('table');

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
                activeView === 'table'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
              onClick={() => setActiveView('table')}
            >
              Table View
            </button>
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                activeView === 'chart'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
              onClick={() => setActiveView('chart')}
            >
              Chart View
            </button>
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                activeView === 'calculator'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
              onClick={() => setActiveView('calculator')}
            >
              Performance Calculator
            </button>
          </div>
        </div>

        {activeView !== 'calculator' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
              Configuration Settings
            </h2>
            <div className={cn(
              "grid gap-6",
              activeView === 'chart' ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
            )}>
              <div className="space-y-2">
                <label htmlFor="hardware" className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Hardware Configuration
                </label>
                <div className="relative">
                  <select
                    id="hardware"
                    value={hardware}
                    onChange={(e) => setHardware(e.target.value as HardwareType)}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none"
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
                          <optgroup key={family} label={family} className="font-semibold text-slate-900 bg-slate-50">
                            {groups[family].map((hw, idx) => (
                              <option key={idx} value={hw.value} className="text-slate-700 bg-white">
                                {hw.name} - {hw.memory}GB
                              </option>
                            ))}
                          </optgroup>
                        );
                      });
                    })()}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="quantization" className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Quantization Level
                </label>
                <div className="relative">
                  <select
                    id="quantization"
                    value={quantization}
                    onChange={(e) => setQuantization(e.target.value as QuantizationType)}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none"
                  >
                    <option value="fp16">FP16 (Full Precision - Highest Quality)</option>
                    <option value="int8">INT8 (Balanced - Good Quality)</option>
                    <option value="q4_k_s">Q4_K_S (Optimized - CPU Compatible)</option>
                    <option value="int4">INT4 (Optimized - Best Performance)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {activeView === 'chart' && (
                <div className="space-y-2">
                  <label htmlFor="metric" className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Metric to Display
                  </label>
                  <div className="relative">
                    <select
                      id="metric"
                      value={metric}
                      onChange={(e) => setMetric(e.target.value as MetricType)}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none"
                    >
                      <option value="ttft">TTFT (ms)</option>
                      <option value="latency">Latency (ms)</option>
                      <option value="users">Concurrent Users</option>
                      <option value="batch">Batch Size</option>
                      <option value="vram">VRAM/RAM (GB)</option>
                      <option value="context">Context Window</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                      </svg>
                    </div>
                  </div>
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
