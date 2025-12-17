import { BarChart3, Settings2, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FooterSections() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
      <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="text-slate-900 font-semibold text-base">
            Performance Metric Definitions
          </h3>
        </div>
        <ul className="space-y-3 text-sm">
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">Throughput:</strong> Tokens/sec - higher is better for batch processing
          </li>
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">Total Latency:</strong> Complete request time from input to output
          </li>
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">TTFT:</strong> Time to First Token - critical for responsiveness
          </li>
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">Concurrent Users:</strong> Max simultaneous users supported
          </li>
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">Batch Size:</strong> Optimal requests processed together
          </li>
        </ul>
      </div>

      <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Settings2 className="h-5 w-5" />
          </div>
          <h3 className="text-slate-900 font-semibold text-base">
            Benchmark Test Configuration
          </h3>
        </div>
        <ul className="space-y-3 text-sm">
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">Input Length:</strong> ~250 tokens (typical prompt)
          </li>
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">Output Length:</strong> ~200 tokens (comprehensive answer)
          </li>
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">Context Window:</strong> 4K to 32K depending on model
          </li>
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">Framework:</strong> vLLM with FlashAttention-2
          </li>
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">Environment:</strong> Production-grade configuration
          </li>
        </ul>
      </div>

      <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Lightbulb className="h-5 w-5" />
          </div>
          <h3 className="text-slate-900 font-semibold text-base">
            Recommended Use Cases
          </h3>
        </div>
        <ul className="space-y-3 text-sm">
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">Small (1B-7B):</strong> Chatbots, semantic search, agents
          </li>
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">Medium (13B-15B):</strong> Support automation, content gen
          </li>
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">Large (30B-40B):</strong> Complex reasoning, code generation
          </li>
          <li className="text-slate-600">
            <strong className="text-slate-900 font-medium">XL (65B+):</strong> Enterprise systems, expert domains
          </li>
        </ul>
      </div>
    </div>
  );
}
