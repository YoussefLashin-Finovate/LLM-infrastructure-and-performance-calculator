'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import InfoBox from '@/components/InfoBox';
import FooterSections from '@/components/FooterSections';
import AdvancedCalculator from '@/components/AdvancedCalculator';
import { QuantizationType, HardwareType } from '@/lib/types';
import { speedBoosts, qualityImpact, quantSpec } from '@/lib/constants';
import HardwareSelect from '@/components/HardwareSelect';
import QuantizationSelect from '@/components/QuantizationSelect';

export default function CombinedViewerPage() {
  const [hardware, setHardware] = useState<HardwareType>('h100-3958,int8'); // H100 INT8 as default
  const [quantization, setQuantization] = useState<QuantizationType>('int4');
  const [activeView, setActiveView] = useState<'calculator'>('calculator');

  return (
    <>
      <Header 
        title="LLM Infrastructure & Performance Calculator"
        subtitle="A production-grade web application for modeling and visualizing Large Language Model (LLM) inference performance across GPUs, quantization levels, and deployment scenarios."
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
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <div>
                <div>
                <HardwareSelect
                  id="hardware"
                  value={hardware}
                  onChange={(v) => setHardware(v as HardwareType)}
                  quantization={quantization}
                />
              </div>
            </div>
            <div>
              <QuantizationSelect
                id="quantization"
                value={quantization}
                onChange={(v) => setQuantization(v as QuantizationType)}
              />
            </div>
          </div>
        </div>

        {/* View Content */}
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
