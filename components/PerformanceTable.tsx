'use client';

import { QuantizationType, HardwareType, MetricType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { calculatePerformance } from '@/lib/calculations';
import { calculateModelSize } from '@/lib/calculationParameters';
import { parseHardwareOpsFromValue } from '@/lib/equations/hardware';
import { normalizeQuantType } from '@/lib/equations/quant';
import { hardwareDatabase } from '@/lib/hardwareDatabase';

interface PerformanceTableProps {
  quantization: QuantizationType;
  hardware: HardwareType;
  metric: MetricType;
}

export default function PerformanceTable({ quantization, hardware, metric }: PerformanceTableProps) {
  // Model categories with representative parameter sizes for calculations
  const modelDefinitions = [
    { models: ["Phi-3", "Gemma 2"], arabicModels: [], paramsLabel: "3.8B-9B", representativeParams: 3.8 },
    { models: ["Mistral 7B", "Llama 3.1 8B", "Qwen 2.5 7B", "Gemma 2 9B", "DeepSeek 7B"], arabicModels: [], paramsLabel: "7B-9B", representativeParams: 7 },
    { models: ["Jais 13B", "Llama 2 13B", "Llama 3.1 13B", "DeepSeek 14B"], arabicModels: ["Jais 13B"], paramsLabel: "13B-14B", representativeParams: 13 },
    { models: ["Gemma 2 27B", "Qwen 2.5 32B"], arabicModels: [], paramsLabel: "27B-32B", representativeParams: 27 },
    { models: ["CodeLlama 34B"], arabicModels: [], paramsLabel: "34B", representativeParams: 34 },
    { models: ["Mixtral 8x7B"], arabicModels: [], paramsLabel: "46.7B MoE", representativeParams: 46.7 },
    { models: ["Llama 3.1 70B", "Qwen 2.5 72B"], arabicModels: [], paramsLabel: "70B-72B", representativeParams: 70 }
  ];

  // Compute live metrics using calculatePerformance and calculation helpers
  const rows = (() => {
    // Resolve hardware
    const hwConfig = hardwareDatabase.find(hw => hw.value === hardware);
    const hardwareOps = parseHardwareOpsFromValue(hwConfig?.value || '0');

    return modelDefinitions.map(def => {
      const inputs = {
        modelParams: def.representativeParams,
        hardwareOps,
        utilization: 0.35,
        inputLength: 100,
        responseLength: 200,
        thinkTime: 5,
        quantType: normalizeQuantType(quantization as string)
      } as any;

      const result = calculatePerformance(inputs);

      // Compute values to display
      const ttft = Math.round((inputs.inputLength / (result.realistic || 1)) * 1000);
      const latency = Math.round(((inputs.inputLength + inputs.responseLength) / (result.realistic || 1)) * 1000);
      const users = Math.max(1, Math.round(result.users));
      const modelSizeGB = Math.round(calculateModelSize(def.representativeParams, quantization));
      const availableMemory = (hwConfig?.memory || 96) - modelSizeGB;
      const batchSize = Math.max(1, Math.floor(availableMemory / Math.max(1, Math.round(modelSizeGB * 0.1))));
      const contextWindow = def.representativeParams < 20 ? 4096 : def.representativeParams < 50 ? 8192 : 16384;

      return {
        ...def,
        ttft,
        latency,
        users,
        batchSize,
        vram: modelSizeGB,
        context: contextWindow
      };
    });
  })();

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm mb-8">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4 w-1/3 min-w-[300px]">
                Models
                <div className="font-normal text-xs text-slate-500 mt-1">Available Options</div>
              </th>
              <th className="p-4 text-center">
                Parameters
                <div className="font-normal text-xs text-slate-500 mt-1">Size Range</div>
              </th>
              <th className="p-4 text-center">
                TTFT
                <div className="font-normal text-xs text-slate-500 mt-1">(ms)</div>
              </th>
              <th className="p-4 text-center">
                Latency
                <div className="font-normal text-xs text-slate-500 mt-1">(ms)</div>
              </th>
              <th className="p-4 text-center">
                Users
                <div className="font-normal text-xs text-slate-500 mt-1">Concurrent</div>
              </th>
              <th className="p-4 text-center">
                Batch
                <div className="font-normal text-xs text-slate-500 mt-1">Size</div>
              </th>
              <th className="p-4 text-center">
                VRAM
                <div className="font-normal text-xs text-slate-500 mt-1">(GB)</div>
              </th>
              <th className="p-4 text-center">
                Context
                <div className="font-normal text-xs text-slate-500 mt-1">Window</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={cn(
                  "hover:bg-slate-50/80 transition-colors",
                  idx % 2 === 1 ? "bg-slate-50/30" : ""
                )}
              >
                <td className="p-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    {row.models.map(model => (
                      <span
                        key={model}
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded text-xs font-medium border",
                          row.arabicModels?.includes(model)
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100/50 text-slate-600 border-slate-200"
                        )}
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-center font-medium text-slate-700 align-middle">
                  {row.paramsLabel}
                </td>
                <td className="p-4 text-center text-slate-600 align-middle">
                  {row.ttft}
                </td>
                <td className="p-4 text-center text-slate-600 align-middle">
                  {row.latency}
                </td>
                <td className="p-4 text-center text-slate-600 align-middle">
                  {row.users}
                </td>
                <td className="p-4 text-center font-semibold text-slate-900 align-middle">
                  {row.batchSize}
                </td>
                <td className="p-4 text-center text-slate-600 align-middle">
                  {row.vram}
                </td>
                <td className="p-4 text-center text-slate-600 align-middle">
                  {row.context.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
