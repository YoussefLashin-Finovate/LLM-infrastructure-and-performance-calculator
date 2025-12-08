export default function CalculatorFooter() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
      <div className="border-2 border-gray-200 p-6 bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-500">
        <h3 className="text-blue-900 text-base font-bold mb-4 border-b-3 border-blue-500 pb-2.5 flex items-center gap-2">
          📊 About These Equations
        </h3>
        <ul className="m-0 pl-5 text-sm leading-relaxed">
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">FLOPs per token:</strong> 6 × N approximates compute for decoder-only transformers (forward pass only)
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Utilization (U):</strong> Accounts for memory bandwidth, kernel efficiency, and overhead (typically 25-40%)
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Quantization (Q):</strong> Overhead from packing/unpacking and reduced precision (80-98% efficient)
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Token-to-word ratio:</strong> 1 token ≈ 0.75 words in English on average
          </li>
        </ul>
      </div>

      <div className="border-2 border-gray-200 p-6 bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-500">
        <h3 className="text-blue-900 text-base font-bold mb-4 border-b-3 border-blue-500 pb-2.5 flex items-center gap-2">
          ⚙️ Hardware Reference
        </h3>
        <ul className="m-0 pl-5 text-sm leading-relaxed">
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">H100:</strong> 989 TFLOPS FP16, 1,979 TOPS INT8, 3,958 TOPS INT4
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">A100 80GB:</strong> 624 TFLOPS FP16, 1,248 TOPS INT8
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">A100 40GB:</strong> 312 TFLOPS FP16, 624 TOPS INT8
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">A6000:</strong> 154.8 TFLOPS FP16 (workstation GPU)
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">CPUs:</strong> Much lower FLOPS, limited by memory bandwidth
          </li>
        </ul>
      </div>

      <div className="border-2 border-gray-200 p-6 bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-500">
        <h3 className="text-blue-900 text-base font-bold mb-4 border-b-3 border-blue-500 pb-2.5 flex items-center gap-2">
          💡 Practical Tips
        </h3>
        <ul className="m-0 pl-5 text-sm leading-relaxed">
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Batch size matters:</strong> Larger batches improve utilization but increase latency
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Memory bandwidth:</strong> Often the real bottleneck for LLM inference
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">KV cache:</strong> Consumes significant VRAM, limits batch size for long contexts
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Real concurrency:</strong> Users don&apos;t send constant requests; actual capacity is higher than calculated
          </li>
        </ul>
      </div>
    </div>
  );
}
