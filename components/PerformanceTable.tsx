'use client';

import { QuantizationType, HardwareType, MetricType } from '@/lib/types';

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
    <div className="overflow-x-auto rounded-xl shadow-md mb-8">
      <table className="w-full border-collapse text-[13px] bg-white">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="bg-gradient-to-r from-blue-900 to-blue-600 text-white p-4 text-left font-semibold border-none text-[13px] uppercase tracking-wide first:rounded-tl-xl">
              Models<br />
              <small className="block font-normal text-[11px] opacity-90 mt-1 normal-case tracking-normal">Available Options</small>
            </th>
            <th className="bg-gradient-to-r from-blue-900 to-blue-600 text-white p-4 text-left font-semibold border-none text-[13px] uppercase tracking-wide">
              Parameters<br />
              <small className="block font-normal text-[11px] opacity-90 mt-1 normal-case tracking-normal">Size Range</small>
            </th>
            <th className="bg-gradient-to-r from-blue-900 to-blue-600 text-white p-4 text-center font-semibold border-none text-[13px] uppercase tracking-wide">
              TTFT<br />
              <small className="block font-normal text-[11px] opacity-90 mt-1 normal-case tracking-normal">(ms)</small>
            </th>
            <th className="bg-gradient-to-r from-blue-900 to-blue-600 text-white p-4 text-center font-semibold border-none text-[13px] uppercase tracking-wide">
              Latency<br />
              <small className="block font-normal text-[11px] opacity-90 mt-1 normal-case tracking-normal">(ms)</small>
            </th>
            <th className="bg-gradient-to-r from-blue-900 to-blue-600 text-white p-4 text-center font-semibold border-none text-[13px] uppercase tracking-wide">
              Users<br />
              <small className="block font-normal text-[11px] opacity-90 mt-1 normal-case tracking-normal">Concurrent</small>
            </th>
            <th className="bg-gradient-to-r from-blue-900 to-blue-600 text-white p-4 text-center font-semibold border-none text-[13px] uppercase tracking-wide">
              Batch<br />
              <small className="block font-normal text-[11px] opacity-90 mt-1 normal-case tracking-normal">Size</small>
            </th>
            <th className="bg-gradient-to-r from-blue-900 to-blue-600 text-white p-4 text-center font-semibold border-none text-[13px] uppercase tracking-wide">
              VRAM<br />
              <small className="block font-normal text-[11px] opacity-90 mt-1 normal-case tracking-normal">(GB)</small>
            </th>
            <th className="bg-gradient-to-r from-blue-900 to-blue-600 text-white p-4 text-center font-semibold border-none text-[13px] uppercase tracking-wide last:rounded-tr-xl">
              Context<br />
              <small className="block font-normal text-[11px] opacity-90 mt-1 normal-case tracking-normal">Window</small>
            </th>
          </tr>
        </thead>
        <tbody>
          {modelCategories.map((cat, idx) => {
            const modelList = cat.models.map(model => {
              if (cat.arabicModels.includes(model)) {
                return `<span class="bg-gradient-to-r from-orange-200 to-orange-400 text-white px-2 py-0.5 rounded-md font-bold shadow-sm">${model}</span>`;
              }
              return model;
            }).join(' • ');

            return (
              <tr
                key={idx}
                className={`transition-all duration-200 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 hover:scale-[1.01] hover:shadow-md`}
              >
                <td className="p-3.5 border border-gray-200 leading-[1.8]" dangerouslySetInnerHTML={{ __html: modelList }} />
                <td className="p-3.5 border border-gray-200">
                  <strong>{cat.params}</strong>
                </td>
                <td className="p-3.5 border border-gray-200 text-center">
                  {cat.ttft}
                </td>
                <td className="p-3.5 border border-gray-200 text-center">
                  {cat.latency}
                </td>
                <td className="p-3.5 border border-gray-200 text-center">
                  {cat.users}
                </td>
                <td className="p-3.5 border border-gray-200 text-center font-bold">
                  {cat.batchSize}
                </td>
                <td className="p-3.5 border border-gray-200 text-center">
                  {cat.vram}
                </td>
                <td className="p-3.5 border border-gray-200 text-center">
                  {cat.context.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
