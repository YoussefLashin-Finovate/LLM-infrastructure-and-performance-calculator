export interface ModelCategory {
  models: string[];
  arabicModels: string[];
  params: string;
  vram: [number, number];
  throughput: [number, number];
  latency: [number, number];
  ttft: [number, number];
  users: [number, number];
  batch: [number, number];
  context: [number, number];
}

export type QuantizationType = 'fp16' | 'int8' | 'q4_k_s' | 'int4';
export type HardwareType = string; // Hardware values like '3958,int8', '1979,fp16', etc.
export type MetricType = 'throughput' | 'latency' | 'ttft' | 'users' | 'batch' | 'vram' | 'context';

export interface QuantizationSpec {
  [key: string]: number;
}

export interface CalculatorInputs {
  modelParams: number;
  hardwareOps: number;
  utilization: number;
  inputLength: number;
  responseLength: number;
  thinkTime: number;
  quantType: 'fp16' | 'int8' | 'int4';
}

export interface CalculatorResults {
  theoretical: number;
  realistic: number;
  users: number;
  tokensPerSecPerUser: number;
  words: number;
  isMemoryBound: boolean;
  prefillOverhead: number;
  attentionOverhead: number;
}

export interface ReverseCalculatorInputs {
  modelParams: number;
  users: number;
  inputLength: number;
  tokensPerUser: number;
  hardwareOpsPerUnit: number;
  utilization: number;
  quantType: 'fp16' | 'int8' | 'int4';
}

export interface ReverseCalculatorResults {
  unitsNeeded: number;
  throughputPerUnit: number;
  totalSystemThroughput: number;
  headroom: number;
  totalOverheadPercent: number;
  overheadBreakdown: string[];
}
