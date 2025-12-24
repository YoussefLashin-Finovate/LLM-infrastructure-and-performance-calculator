'use client';

import { useMemo, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartConfiguration } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { calculatePerformance } from '@/lib/calculations';
import { calculateModelSize, quantEfficiency } from '@/lib/calculationParameters';
import { hardwareDatabase } from '@/lib/hardwareDatabase';
import { parseHardwareOpsFromValue } from '@/lib/equations/hardware';
import { normalizeQuantType } from '@/lib/equations/quant';
import { QuantizationType, HardwareType, MetricType } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface PerformanceChartProps {
  quantization: QuantizationType;
  hardware: HardwareType;
  metric: MetricType;
}

export default function PerformanceChart({ quantization, hardware, metric }: PerformanceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  // Calculate chart data
  const chartData = useMemo(() => {
    console.log('PerformanceChart calculating data for:', { quantization, hardware, metric });

    // Find the hardware configuration from the database
    const hwConfig = hardwareDatabase.find(hw => hw.value === hardware);
    if (!hwConfig) {
      console.error('Hardware not found:', hardware);
      console.log('Available hardware:', hardwareDatabase.map(hw => hw.value));
      return null;
    }

    console.log('Found hardware config:', hwConfig);

    // Parse hardware ops (TFLOPS/POPS) - extract the numeric value
    const hardwareOps = parseHardwareOpsFromValue(hwConfig.value);

    // Model sizes for different categories (using the same models as before)
    const modelSizes = [7, 13, 27, 34, 46.7, 70]; // Representative sizes for each category
    const labels = ['7B-9B', '13B-14B', '27B-32B', '34B', '46.7B MoE', '70B-72B'];

    const dataMin: number[] = [];
    const dataMax: number[] = [];
    let yAxisLabel = '';
    let chartTitle = '';

    modelSizes.forEach(modelSize => {
      let minVal: number, maxVal: number;

      // Use the same calculation logic as the main calculator
      // Normalize quantization type to values supported by calculators
      const normQuant = normalizeQuantType(quantization as string);

      const baseInputs = {
        modelParams: modelSize,
        hardwareOps,
        utilization: 0.35, // Default utilization
        inputLength: 100,
        responseLength: 200,
        thinkTime: 5,
        quantType: normQuant
      };

      switch (metric) {
        case 'throughput':
          // Calculate throughput using the same formula
          const result = calculatePerformance(baseInputs);
          
          // Ensure we have valid numbers
          if (!isFinite(result.realistic) || result.realistic <= 0) {
            console.error('Invalid throughput calculation:', result);
            minVal = Math.max(1, modelSize); // Fallback based on model size
            maxVal = Math.max(2, modelSize * 1.5);
          } else {
            minVal = Math.max(1, Math.round(result.realistic * 0.8)); // Min range, at least 1
            maxVal = Math.max(2, Math.round(result.realistic * 1.2)); // Max range, at least 2
          }
          yAxisLabel = 'Throughput (tokens/sec)';
          chartTitle = 'LLM Throughput by Model Size';
          break;
        case 'latency':
          // Latency is inversely related to throughput
          const latencyResult = calculatePerformance(baseInputs);
          const avgLatency = (baseInputs.inputLength + baseInputs.responseLength) / latencyResult.realistic * 1000;
          minVal = Math.round(avgLatency * 0.8);
          maxVal = Math.round(avgLatency * 1.2);
          yAxisLabel = 'Latency (ms)';
          chartTitle = 'LLM Latency by Model Size';
          break;
        case 'ttft':
          // TTFT is roughly input processing time
          const ttftResult = calculatePerformance(baseInputs);
          const ttft = baseInputs.inputLength / ttftResult.realistic * 1000;
          minVal = Math.round(ttft * 0.8);
          maxVal = Math.round(ttft * 1.2);
          yAxisLabel = 'TTFT (ms)';
          chartTitle = 'LLM Time to First Token by Model Size';
          break;
        case 'users':
          // Users calculation using the same formula
          const usersResult = calculatePerformance(baseInputs);
          minVal = Math.round(usersResult.users * 0.8);
          maxVal = Math.round(usersResult.users * 1.2);
          yAxisLabel = 'Concurrent Users';
          chartTitle = 'LLM Concurrent Users by Model Size';
          break;
        case 'batch':
          // Batch size estimation based on hardware memory
          const modelSizeGB = calculateModelSize(modelSize, quantization);
          const availableMemory = hwConfig.memory - modelSizeGB;
          const batchSize = Math.max(1, Math.floor(availableMemory / (modelSizeGB * 0.1))); // Rough estimation
          minVal = Math.round(batchSize * 0.5);
          maxVal = Math.round(batchSize * 1.5);
          yAxisLabel = 'Batch Size';
          chartTitle = 'LLM Batch Size by Model Size';
          break;
        case 'vram':
          // VRAM calculation using the same formula as calculators
          const vramGB = calculateModelSize(modelSize, quantization);
          minVal = Math.round(vramGB * 0.9); // Min with some variation
          maxVal = Math.round(vramGB * 1.1); // Max with some variation
          yAxisLabel = 'VRAM (GB)';
          chartTitle = 'LLM VRAM Usage by Model Size';
          break;
        case 'context':
          // Context window estimation based on model size
          const contextBase = modelSize < 20 ? 4096 : modelSize < 50 ? 8192 : 16384;
          minVal = Math.round(contextBase * 0.8);
          maxVal = Math.round(contextBase * 1.2);
          yAxisLabel = 'Context Window (tokens)';
          chartTitle = 'LLM Context Window by Model Size';
          break;
        default:
          minVal = 0;
          maxVal = 0;
      }

      dataMin.push(minVal);
      dataMax.push(maxVal);
    });

    // Ensure we have valid data
    if (dataMin.length === 0 || dataMax.length === 0 || dataMin.some(isNaN) || dataMax.some(isNaN)) {
      console.error('Invalid chart data, using fallback');
      // Fallback data
      const fallbackData = [10, 20, 30, 40, 50, 60];
      dataMin.splice(0, dataMin.length, ...fallbackData.map(x => x * 0.8));
      dataMax.splice(0, dataMax.length, ...fallbackData.map(x => x * 1.2));
    }

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Min ' + metric.charAt(0).toUpperCase() + metric.slice(1),
            data: dataMin,
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1
          },
          {
            label: 'Max ' + metric.charAt(0).toUpperCase() + metric.slice(1),
            data: dataMax,
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: chartTitle,
            font: {
              size: 16
            }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: yAxisLabel
            }
          },
          x: {
            title: {
              display: true,
              text: 'Model Parameters'
            }
          }
        }
      }
    };

    return config;
  }, [quantization, hardware, metric]);

  if (!chartData) {
    return (
      <div className="rounded-xl shadow-md mb-8 p-5 bg-white">
        <div className="text-center text-red-500">Error: Hardware configuration not found</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-md mb-8 p-5 bg-white">
      <Bar data={chartData.data} options={chartData.options} />
    </div>
  );
}
