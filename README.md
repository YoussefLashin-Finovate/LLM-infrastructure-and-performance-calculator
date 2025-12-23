# LLM Performance Calculator

A comprehensive web application for calculating and visualizing Large Language Model (LLM) inference performance metrics across different hardware configurations, quantization levels, and model architectures.

## 🚀 Features

### 📊 Performance Analysis

- **Comprehensive Metrics**: TTFT (Time to First Token), Latency, Throughput, Concurrent Users, Batch Size, VRAM Usage, Context Window
- **Real-time Calculations**: Dynamic performance calculations based on hardware specifications and quantization levels
- **Model Comparisons**: Side-by-side comparison of different LLM architectures and sizes

### 🎯 Multiple View Modes

- **Table View**: Complete performance overview with all metrics displayed simultaneously
- **Chart View**: Interactive visualizations with selectable metrics
- **Performance Calculator**: Advanced calculation tools for custom scenarios

### 🖥️ Hardware Support

- **NVIDIA GPUs**: H100, A100, RTX 3090 series
- **Quantization Levels**: FP16, INT8, Q4_K_S, INT4
- **Real-world Benchmarks**: Based on MLCommons methodology

### 🌍 Arabic Language Support

- **Jais Models**: Specialized Arabic-capable language models
- **Multilingual Performance**: Optimized for Arabic and general-purpose LLMs

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.7 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Charts**: Chart.js with react-chartjs-2
- **UI Components**: Custom React components
- **Build Tool**: Turbopack

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd llms
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🏗️ Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
llms/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main application page
│   ├── viewer/            # Combined viewer page
│   ├── chart/             # Chart-only page
│   ├── table/             # Table-only page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── Header.tsx         # Application header
│   ├── PerformanceTable.tsx # Comprehensive performance table
│   ├── PerformanceChart.tsx  # Interactive performance charts
│   ├── AdvancedCalculator.tsx # Calculation tools
│   └── InfoBox.tsx        # Information display component
├── lib/                   # Core logic and data
│   ├── calculations.ts    # Performance calculation algorithms
│   ├── hardwareDatabase.ts # Hardware specifications
│   ├── constants.ts       # Application constants
│   ├── types.ts           # TypeScript type definitions
│   └── config.ts          # Configuration settings
├── hooks/                 # Custom React hooks
├── public/                # Static assets
└── styles/                # Global styles
```

## 🎮 Usage

### Table View

- Displays all performance metrics simultaneously
- Compare different model families side-by-side
- View batch sizes, latency, and resource requirements

### Chart View

- Interactive charts with selectable metrics
- Choose from TTFT, Latency, Users, Batch Size, VRAM, or Context Window
- Visualize performance trends across model sizes

### Performance Calculator

- Advanced calculation tools
- Custom hardware configurations
- Detailed performance analysis

### Configuration Options

- **Hardware**: Select from various GPU configurations
- **Quantization**: Choose between FP16, INT8, Q4_K_S, or INT4
- **Metrics**: Select specific metrics for chart visualization

## 🔧 Configuration

### Hardware Database

Located in `lib/hardwareDatabase.ts`, contains specifications for:

- NVIDIA H100 series
- NVIDIA A100 series
- RTX 3090 series
- Memory capacities and performance ratings

### Model Categories

Pre-configured model families with performance characteristics:

- Small models (3.8B-9B parameters)
- Medium models (7B-9B parameters)
- Large models (13B-14B parameters)
- XL models (27B-32B parameters)
- XXL models (34B+ parameters)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed by Finovate.

## 📞 Support

For support or questions, please contact the development team.

## 🔄 Updates

- **v0.1.0**: Initial release with comprehensive LLM performance analysis
- Support for multiple hardware configurations
- Interactive charts and tables
- Arabic language model support

## ⚠️ Deprecation / Migration

- The old function `calculateReverseInfrastructure` has been **renamed and replaced** by `calculateLlmInfrastructure` in `lib/calculations/llmInfrastructure.ts` for clearer intent and maintainability.
- For backward compatibility we provide a small wrapper at `lib/calculations/reverse.ts` that forwards calls to the new implementation and emits a deprecation warning. The wrapper will be removed in a future release — please update any direct imports to use `calculateLlmInfrastructure` instead.

## 🧰 Developer notes (cleanup)

- Removed unused example helper `lib/examples/equationChecks.ts` (empty/placeholder).
- Removed deprecated constant `FLOPS_PER_TOKEN` from `lib/equations/constants.ts` — it was unused.
- Kept small backward-compatible re-exports and wrappers (e.g., `lib/modelArchitectures.ts`, `lib/calculations/reverse.ts`) to avoid breaking downstream consumers. These will be removed in a future major release after a transition window.

**Developer action:** Run `npm test` and `npx tsc` locally after pulling these changes; if you maintain external integrations, update imports to use the new names.

---

**Built with ❤️ by Finovate**
