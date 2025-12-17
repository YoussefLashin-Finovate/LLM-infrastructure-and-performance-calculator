'use client';

import { QuantizationType, HardwareType, MetricType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PerformanceTableProps {
  quantization: QuantizationType;
  hardware: HardwareType;
  metric: MetricType;
}

export default function PerformanceTable({ quantization, hardware, metric }: PerformanceTableProps) {
  const modelCategories = [
    {
      models: ["Phi-3", "Gemma 2"],
      arabicModels: [],
      params: "3.8B-9B",
      ttft: 38,
      latency: 57,
      users: 25,
      batchSize: 180,
      vram: 18,
      context: 4096
    },
    {
      models: ["Mistral 7B", "Llama 3.1 8B", "Qwen 2.5 7B", "Gemma 2 9B", "DeepSeek 7B"],
      arabicModels: [],
      params: "7B-9B",
      ttft: 80,
      latency: 120,
      users: 12,
      batchSize: 156,
      vram: 16,
      context: 4096
    },
    {
      models: ["Jais 13B", "Llama 2 13B", "Llama 3.1 13B", "DeepSeek 14B"],
      arabicModels: ["Jais 13B"],
      params: "13B-14B",
      ttft: 140,
      latency: 210,
      users: 7,
      batchSize: 92,
      vram: 28,
      context: 4096
    },
    {
      models: ["Gemma 2 27B", "Qwen 2.5 32B"],
      arabicModels: [],
      params: "27B-32B",
      ttft: 300,
      latency: 450,
      users: 3,
      batchSize: 39,
      vram: 64,
      context: 8192
    },
    {
      models: ["CodeLlama 34B"],
      arabicModels: [],
      params: "34B",
      ttft: 340,
      latency: 510,
      users: 3,
      batchSize: 29,
      vram: 68,
      context: 8192
    },
    {
      models: ["Mixtral 8x7B"],
      arabicModels: [],
      params: "46.7B MoE",
      ttft: 467,
      latency: 700,
      users: 2,
      batchSize: 18,
      vram: 93,
      context: 16384
    },
    {
      models: ["Llama 3.1 70B", "Qwen 2.5 72B"],
      arabicModels: [],
      params: "70B-72B",
      ttft: 700,
      latency: 1050,
      users: 1,
      batchSize: 9,
      vram: 140,
      context: 16384
    }
  ];

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
            {modelCategories.map((cat, idx) => (
              <tr
                key={idx}
                className={cn(
                  "hover:bg-slate-50/80 transition-colors",
                  idx % 2 === 1 ? "bg-slate-50/30" : ""
                )}
              >
                <td className="p-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    {cat.models.map(model => (
                      <span
                        key={model}
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded text-xs font-medium border",
                          cat.arabicModels.includes(model)
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
                  {cat.params}
                </td>
                <td className="p-4 text-center text-slate-600 align-middle">
                  {cat.ttft}
                </td>
                <td className="p-4 text-center text-slate-600 align-middle">
                  {cat.latency}
                </td>
                <td className="p-4 text-center text-slate-600 align-middle">
                  {cat.users}
                </td>
                <td className="p-4 text-center font-semibold text-slate-900 align-middle">
                  {cat.batchSize}
                </td>
                <td className="p-4 text-center text-slate-600 align-middle">
                  {cat.vram}
                </td>
                <td className="p-4 text-center text-slate-600 align-middle">
                  {cat.context.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
