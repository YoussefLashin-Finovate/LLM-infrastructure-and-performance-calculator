'use client';

import Header from '@/components/Header';
import InfoBox from '@/components/InfoBox';
import FooterSections from '@/components/FooterSections';
import PerformanceChart from '@/components/PerformanceChart';
import { QuantizationType, HardwareType, MetricType } from '@/lib/types';

export default function ChartViewerPage() {
  // Fixed configuration for the chart
  const hardware: HardwareType = 'h100-3958,int8'; // H100 INT8 as default
  const quantization: QuantizationType = 'int4';
  const metric: MetricType = 'batch';

  return (
    <>
      <Header 
        title="LLM Infrastructure & Performance Calculator"
        subtitle="Performance metrics for Arabic-capable and general-purpose language models<br>Comprehensive benchmarks for models under 70B parameters"
      />
      
      <div className="py-10 px-12">
        <InfoBox>
          <div>
            <strong>Chart Configuration:</strong> This chart shows <span className="font-bold text-blue-800">Batch Size</span> metrics 
            for <span className="font-bold text-blue-800">H100 INT8 Tensor</span> hardware 
            with <span className="font-bold text-blue-800">INT4</span> quantization.
          </div>
        </InfoBox>

        <PerformanceChart quantization={quantization} hardware={hardware} metric={metric} />

        <FooterSections />


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
