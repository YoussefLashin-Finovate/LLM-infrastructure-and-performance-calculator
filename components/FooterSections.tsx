export default function FooterSections() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
      <div className="border-2 border-gray-200 p-6 bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-500">
        <h3 className="text-blue-900 text-base font-bold mb-4 border-b-3 border-blue-500 pb-2.5 flex items-center gap-2">
          📊 Performance Metric Definitions
        </h3>
        <ul className="m-0 pl-5 text-sm leading-relaxed">
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Throughput:</strong> Number of output tokens generated per second - higher is better for batch processing
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Total Latency:</strong> Complete request processing time from input to final output
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">TTFT:</strong> Time to First Token - critical for user-perceived responsiveness in interactive applications
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Concurrent Users:</strong> Maximum number of simultaneous users the system can efficiently support
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Batch Size:</strong> Optimal number of requests processed together for maximum efficiency
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Context Window:</strong> Maximum number of tokens the model can process in a single request
          </li>
        </ul>
      </div>

      <div className="border-2 border-gray-200 p-6 bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-500">
        <h3 className="text-blue-900 text-base font-bold mb-4 border-b-3 border-blue-500 pb-2.5 flex items-center gap-2">
          ⚙️ Benchmark Test Configuration
        </h3>
        <ul className="m-0 pl-5 text-sm leading-relaxed">
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Input Length:</strong> Average 250 tokens per request (typical user prompt)
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Output Length:</strong> Average 200 tokens per response (comprehensive answer)
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Context Window:</strong> Ranges from 4K to 32K tokens depending on model architecture
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Inference Framework:</strong> vLLM with FlashAttention-2 optimization for maximum throughput
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Batching Strategy:</strong> Continuous batching enabled for optimal resource utilization
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Test Environment:</strong> Production-grade configuration with real-world load patterns
          </li>
        </ul>
      </div>

      <div className="border-2 border-gray-200 p-6 bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-500">
        <h3 className="text-blue-900 text-base font-bold mb-4 border-b-3 border-blue-500 pb-2.5 flex items-center gap-2">
          💡 Recommended Use Cases by Model Size
        </h3>
        <ul className="m-0 pl-5 text-sm leading-relaxed">
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Small Models (1B-7B):</strong> Ideal for chatbots, semantic search, text classification, embeddings generation, and AI agents with fast response requirements
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Medium Models (13B-15B):</strong> Perfect for customer support automation, content generation, language translation, and summarization tasks
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Large Models (30B-40B):</strong> Best suited for complex reasoning, advanced code generation, research assistance, and sophisticated dialogue systems
          </li>
          <li className="mb-2 text-slate-600">
            <strong className="text-slate-800 font-semibold">Very Large Models (65B-70B):</strong> Enterprise-grade expert systems, multi-domain AI assistants, and mission-critical applications requiring highest accuracy
          </li>
        </ul>
      </div>
    </div>
  );
}
