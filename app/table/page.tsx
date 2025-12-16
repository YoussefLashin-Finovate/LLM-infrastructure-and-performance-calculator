import Header from '@/components/Header';
import InfoBox from '@/components/InfoBox';
import FooterSections from '@/components/FooterSections';
import PerformanceTable from '@/components/PerformanceTable';
import { QuantizationType, HardwareType, MetricType } from '@/lib/types';
import { hardwareDatabase } from '@/lib/hardwareDatabase';

export default function TableViewerPage() {
  // Show all configurations in the table
  const configurations = [
    { hardware: 'h100-3958,int8' as HardwareType, quantization: 'int8' as QuantizationType, name: 'H100 INT8' },
    { hardware: 'h100-1979,fp16' as HardwareType, quantization: 'fp16' as QuantizationType, name: 'H100 FP16' },
    { hardware: 'a100-312,fp16' as HardwareType, quantization: 'fp16' as QuantizationType, name: 'A100 FP16' },
    { hardware: 'a100-624,int4' as HardwareType, quantization: 'int4' as QuantizationType, name: 'A100 INT4' },
    { hardware: '3090-35.6,fp32' as HardwareType, quantization: 'fp16' as QuantizationType, name: 'RTX 3090 FP16' },
  ];

  const metric: MetricType = 'throughput';

  return (
    <>
      <Header 
        title="LLM Inference Performance Reference"
        subtitle="Performance metrics for Arabic-capable and general-purpose language models<br>Comprehensive benchmarks for models under 70B parameters"
      />
      
      <div className="py-10 px-12">
        <InfoBox>
          <div>
            <strong>Comprehensive Performance Table:</strong> This table compares <span className="font-bold text-blue-800">Throughput</span> performance 
            across different hardware configurations and quantization levels for Llama 3.1 70B model.
          </div>
        </InfoBox>

        <div className="space-y-8">
          {configurations.map((config, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">{config.name} Configuration</h3>
              <PerformanceTable 
                quantization={config.quantization} 
                hardware={config.hardware} 
                metric={metric} 
              />
            </div>
          ))}
        </div>

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
