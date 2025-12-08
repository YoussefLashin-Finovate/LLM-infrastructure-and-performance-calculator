/**
 * Central Configuration File
 * All configurable numbers and strategies are defined here
 * Change values here to adjust application behavior globally
*/

//============================================================================
// MODEL CONFIGURATION
//============================================================================

export interface ModelOption {
  value: string;
  name: string;
  params: number;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { value: '3.8', name: 'Phi-3 Mini (3.8B)', params: 3.8 },
  { value: '7', name: 'Mistral 7B', params: 7 },
  { value: '8', name: 'Llama 3.1 8B', params: 8 },
  { value: '7', name: 'Qwen 2.5 7B', params: 7 },
  { value: '9', name: 'Gemma 2 9B', params: 9 },
  { value: '13', name: 'Jais 13B (Arabic)', params: 13 },
  { value: '13', name: 'Llama 2 13B', params: 13 },
  { value: '13', name: 'Llama 3.1 13B', params: 13 },
  { value: '14', name: 'DeepSeek 14B', params: 14 },
  { value: '27', name: 'Gemma 2 27B', params: 27 },
  { value: '32', name: 'Qwen 2.5 32B', params: 32 },
  { value: '34', name: 'CodeLlama 34B', params: 34 },
  { value: '46.7', name: 'Mixtral 8x7B (46.7B)', params: 46.7 },
  { value: '70', name: 'Llama 3.1 70B', params: 70 },
  { value: '72', name: 'Qwen 2.5 72B', params: 72 },
  { value: '405', name: 'Llama 3.1 405B', params: 405 },
];

// ============================================================================
// QUANTIZATION CONFIGURATION
// ============================================================================

export interface QuantizationOption {
  value: string;
  name: string;
  bytesPerParam: number;
  efficiency: number;
}

export const QUANTIZATION_OPTIONS: QuantizationOption[] = [
  { value: 'fp32', name: 'FP32 (Full Precision - 4 bytes/param)', bytesPerParam: 4, efficiency: 1.0 },
  { value: 'fp16', name: 'FP16/BF16 (Half Precision - 2 bytes/param)', bytesPerParam: 2, efficiency: 0.95 },
  { value: 'fp8', name: 'FP8 (8-bit Float - 1 byte/param)', bytesPerParam: 1, efficiency: 0.92 },
  { value: 'int8', name: 'INT8 (8-bit Integer - 1 byte/param)', bytesPerParam: 1, efficiency: 0.88 },
  { value: 'int4', name: 'INT4/FP4 (4-bit - 0.5 bytes/param)', bytesPerParam: 0.5, efficiency: 0.80 },
];

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_VALUES = {
  // Performance Calculator Defaults
  performance: {
    model: '70',
    quantization: 'int8',
    hardware: 'h100-3958,int8',
    utilization: 0.35,
    inputLength: 100,
    responseLength: 200,
    thinkTime: 5,
  },
  
  // Capacity Planning Defaults
  capacity: {
    model: '70',
    quantization: 'int8',
    hardware: 'h100-3958,int8',
    users: 100,
    inputLength: 100,
    tokensPerSec: 10,
    utilization: 0.35,
  },
};

// ============================================================================
// CALCULATION CONSTANTS
// ============================================================================

export const CALCULATION_CONSTANTS = {
  // Performance thresholds
  utilizationMin: 0.1,
  utilizationMax: 0.9,
  utilizationTypical: [0.25, 0.40],
  
  // Input/output ranges
  typicalInputRange: [50, 200],
  longContextThreshold: 1000,
  typicalOutputRange: [5, 20],
  
  // Think time
  minThinkTime: 0.5,
  defaultThinkTime: 5,
  
  // Words per token ratio
  wordsPerToken: 0.75,
  
  // Step increments for inputs
  steps: {
    utilization: 0.05,
    inputLength: 10,
    responseLength: 10,
    thinkTime: 0.5,
    users: 10,
    tokensPerSec: 1,
  },
};

// ============================================================================
// HARDWARE GROUPING CONFIGURATION
// ============================================================================

export const HARDWARE_FAMILIES = [
  'NVIDIA B200 Blackwell',
  'NVIDIA B300 Blackwell Ultra',
  'NVIDIA H200',
  'NVIDIA H100',
  'NVIDIA A100 80GB',
  'NVIDIA A100 40GB',
  'NVIDIA A6000',
  'NVIDIA A5000',
  'AMD MI300X',
  'Intel Gaudi 3',
  'Intel Gaudi 2',
];

export function getHardwareFamily(hardwareName: string): string {
  const name = hardwareName.toLowerCase();
  if (name.includes('b200')) return 'NVIDIA B200 Blackwell';
  if (name.includes('b300')) return 'NVIDIA B300 Blackwell Ultra';
  if (name.includes('h200')) return 'NVIDIA H200';
  if (name.includes('h100')) return 'NVIDIA H100';
  if (name.includes('a100 80gb')) return 'NVIDIA A100 80GB';
  if (name.includes('a100 40gb')) return 'NVIDIA A100 40GB';
  if (name.includes('a6000')) return 'NVIDIA A6000';
  if (name.includes('a5000')) return 'NVIDIA A5000';
  if (name.includes('mi300x')) return 'AMD MI300X';
  if (name.includes('gaudi 3')) return 'Intel Gaudi 3';
  if (name.includes('gaudi 2')) return 'Intel Gaudi 2';
  return 'Other';
}

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const UI_CONFIG = {
  colors: {
    primary: '#047857',
    primaryLight: '#10b981',
    primaryBg: '#ecfdf5',
    primaryBgGradient: 'linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)',
    secondary: '#6b7280',
    border: '#e5e7eb',
    borderLight: '#d1fae5',
  },
  
  spacing: {
    sectionGap: '48px',
    cardGap: '24px',
    inputGap: '16px',
  },
  
  typography: {
    headingSize: '36px',
    subheadingSize: '20px',
    bodySize: '17px',
    smallSize: '14px',
  },
  
  icons: {
    performance: '⚡',
    capacity: '🖥️',
    settings: '⚙️',
    users: '👥',
    target: '🎯',
    memory: '💾',
    compute: '⚙️',
    chart: '📊',
    requirements: '📐',
    info: '💡',
  },
};

// ============================================================================
// HELPER TEXT CONFIGURATION
// ============================================================================

export const HELPER_TEXT = {
  modelSize: (size: number) => `Model size: ${size.toFixed(1)} GB`,
  quantizationNote: 'Affects model size and available hardware',
  utilizationTypical: `Typical: ${CALCULATION_CONSTANTS.utilizationTypical[0]}-${CALCULATION_CONSTANTS.utilizationTypical[1]}`,
  inputLengthNote: `Typical prompts: ${CALCULATION_CONSTANTS.typicalInputRange[0]}-${CALCULATION_CONSTANTS.typicalInputRange[1]}, Long context: ${CALCULATION_CONSTANTS.longContextThreshold}+`,
  thinkTimeNote: 'Time between user requests',
  outputRateNote: `Output generation rate (typically ${CALCULATION_CONSTANTS.typicalOutputRange[0]}-${CALCULATION_CONSTANTS.typicalOutputRange[1]})`,
  usersNote: 'Number of simultaneous users you want to support',
  compatibleOptions: (count: number) => `${count} compatible options`,
};

// ============================================================================
// INFORMATIONAL CONTENT
// ============================================================================

export const INFO_CONTENT = {
  performanceCalculation: `📊 Performance Calculation Model:

1. Theoretical Peak Throughput:
• Compute Limit: FLOPS ÷ (6 × Parameters × 10⁹)
• Memory Limit: Bandwidth ÷ (Model_Size + KV_Cache)
• Actual Bottleneck = min(compute, memory)

2. Production Throughput:
• Base = Theoretical × Utilization × Quantization
• Prefill Overhead: -15% per 1000 input tokens
• Attention Overhead: -20% per 10K sequence length

3. Concurrent User Capacity:
• Users = Throughput ÷ (Output ÷ Think_Time)
• Per-user token generation rate considered

Key Parameters:
• U = 0.25-0.40 (system utilization factor)
• Q = 0.80-0.95 (quantization efficiency)
• 6N = FLOPs per output token (transformer operations)`,

  productionPlanning: `💡 Production Planning Guide:

Overhead Factors Applied:
• Prefill: +15% per 1000 input tokens (batch processing)
• Attention: +20% per 10K sequence (O(n²) complexity)
• Redundancy: +15% (N+1 failover, peak handling)

Capacity Planning:
• Always round UP to whole units
• Target 10-20% headroom for bursts
• Plan for 1-2 units offline (maintenance)
• Monitor: aim for 60-80% average utilization

Cost Optimization:
• Batch users during low traffic
• Use smaller models for simple queries
• INT8/INT4 quantization: 40-60% cost savings`,
};
