export interface HardwareOption {
  value: string;
  name: string;
  memory: number; // GPU: VRAM in GB, CPU: Max System RAM in GB
  quantTypes: string[];
  type?: 'gpu' | 'cpu'; // Hardware type
}

export const hardwareDatabase: HardwareOption[] = [
  // NVIDIA B200 Blackwell
  { value: '75,fp32', name: 'B200 FP32 (75 TFLOPS)', memory: 192, quantTypes: ['fp32'], type: 'gpu' },
  { value: '2200,fp32', name: 'B200 FP32 Tensor Core (2.2 PFLOPS)', memory: 192, quantTypes: ['fp32'], type: 'gpu' },
  { value: '4500,fp16', name: 'B200 FP16/BF16 Tensor (4.5 PFLOPS)', memory: 192, quantTypes: ['fp16'], type: 'gpu' },
  { value: '9000,fp8', name: 'B200 FP8 Tensor (9 PFLOPS)', memory: 192, quantTypes: ['fp8'], type: 'gpu' },
  { value: '9000,int8', name: 'B200 INT8 Tensor (9 POPS)', memory: 192, quantTypes: ['int8'], type: 'gpu' },
  { value: '18000,int4', name: 'B200 FP4 Dense (18 PFLOPS)', memory: 192, quantTypes: ['int4'], type: 'gpu' },
  { value: '9000,int4', name: 'B200 FP4 Sparse (9 PFLOPS)', memory: 192, quantTypes: ['int4'], type: 'gpu' },
  // NVIDIA B300 Blackwell Ultra
  { value: '75,fp32', name: 'B300 FP32 (75 TFLOPS)', memory: 192, quantTypes: ['fp32'], type: 'gpu' },
  { value: '2200,fp32', name: 'B300 FP32 Tensor Core (2.2 PFLOPS)', memory: 192, quantTypes: ['fp32'], type: 'gpu' },
  { value: '4500,fp16', name: 'B300 FP16/BF16 Tensor (4.5 PFLOPS)', memory: 192, quantTypes: ['fp16'], type: 'gpu' },
  { value: '9000,fp8', name: 'B300 FP8 Tensor (9 PFLOPS)', memory: 192, quantTypes: ['fp8'], type: 'gpu' },
  { value: '9000,int8', name: 'B300 INT8 Tensor (9 POPS)', memory: 192, quantTypes: ['int8'], type: 'gpu' },
  { value: '18000,int4', name: 'B300 FP4 Dense (18 PFLOPS)', memory: 192, quantTypes: ['int4'], type: 'gpu' },
  { value: '14000,int4', name: 'B300 FP4 Sparse (14 PFLOPS)', memory: 192, quantTypes: ['int4'], type: 'gpu' },
  // NVIDIA H200
  { value: 'h200-67,fp32', name: 'H200 FP32 (67 TFLOPS)', memory: 141, quantTypes: ['fp32'], type: 'gpu' },
  { value: 'h200-989,fp32', name: 'H200 FP32 Tensor Core (989 TFLOPS)', memory: 141, quantTypes: ['fp32'], type: 'gpu' },
  { value: 'h200-1979,fp16', name: 'H200 FP16/BF16 Tensor (1.979 PFLOPS)', memory: 141, quantTypes: ['fp16'], type: 'gpu' },
  { value: 'h200-3958,fp8', name: 'H200 FP8 Tensor (3.958 PFLOPS)', memory: 141, quantTypes: ['fp8'], type: 'gpu' },
  { value: 'h200-3958,int8', name: 'H200 INT8 Tensor (3.958 POPS)', memory: 141, quantTypes: ['int8'], type: 'gpu' },
  // NVIDIA H100
  { value: 'h100-67,fp32', name: 'H100 FP32 (67 TFLOPS)', memory: 80, quantTypes: ['fp32'], type: 'gpu' },
  { value: 'h100-989,fp32', name: 'H100 FP32 Tensor Core (989 TFLOPS)', memory: 80, quantTypes: ['fp32'], type: 'gpu' },
  { value: 'h100-1979,fp16', name: 'H100 FP16/BF16 Tensor (1.979 PFLOPS)', memory: 80, quantTypes: ['fp16'], type: 'gpu' },
  { value: 'h100-3958,fp8', name: 'H100 FP8 Tensor (3.958 PFLOPS)', memory: 80, quantTypes: ['fp8'], type: 'gpu' },
  { value: 'h100-3958,int8', name: 'H100 INT8 Tensor (3.958 POPS)', memory: 80, quantTypes: ['int8'], type: 'gpu' },
  // NVIDIA A100 80GB
  { value: '156,fp32', name: 'A100 80GB FP32 (156 TFLOPS)', memory: 80, quantTypes: ['fp32'], type: 'gpu' },
  { value: '312,fp16', name: 'A100 80GB FP16 (312 TFLOPS)', memory: 80, quantTypes: ['fp16'], type: 'gpu' },
  { value: '624,int8', name: 'A100 80GB INT8 (624 TOPS)', memory: 80, quantTypes: ['int8'], type: 'gpu' },
  { value: '1248,int4', name: 'A100 80GB INT4 (1248 TOPS)', memory: 80, quantTypes: ['int4'], type: 'gpu' },
  // NVIDIA A100 40GB
  { value: '78,fp32', name: 'A100 40GB FP32 (78 TFLOPS)', memory: 40, quantTypes: ['fp32'], type: 'gpu' },
  { value: '156,fp16', name: 'A100 40GB FP16 (156 TFLOPS)', memory: 40, quantTypes: ['fp16'], type: 'gpu' },
  { value: '312,int8', name: 'A100 40GB INT8 (312 TOPS)', memory: 40, quantTypes: ['int8'], type: 'gpu' },
  { value: '624,int4', name: 'A100 40GB INT4 (624 TOPS)', memory: 40, quantTypes: ['int4'], type: 'gpu' },
  // NVIDIA A6000
  { value: '38.7,fp32', name: 'A6000 FP32 (38.7 TFLOPS)', memory: 48, quantTypes: ['fp32'], type: 'gpu' },
  { value: '77.4,fp16', name: 'A6000 FP16 (77.4 TFLOPS)', memory: 48, quantTypes: ['fp16'], type: 'gpu' },
  { value: '154.8,int8', name: 'A6000 INT8 (154.8 TOPS)', memory: 48, quantTypes: ['int8'], type: 'gpu' },
  { value: '309.6,int4', name: 'A6000 INT4 (309.6 TOPS)', memory: 48, quantTypes: ['int4'], type: 'gpu' },
  // NVIDIA A5000
  { value: '32.5,fp32', name: 'A5000 FP32 (32.5 TFLOPS)', memory: 24, quantTypes: ['fp32'], type: 'gpu' },
  { value: '65,fp16', name: 'A5000 FP16 (65 TFLOPS)', memory: 24, quantTypes: ['fp16'], type: 'gpu' },
  { value: '130,int8', name: 'A5000 INT8 (130 TOPS)', memory: 24, quantTypes: ['int8'], type: 'gpu' },
  { value: '260,int4', name: 'A5000 INT4 (260 TOPS)', memory: 24, quantTypes: ['int4'], type: 'gpu' },
  // AMD MI300X
  { value: '163.25,fp32', name: 'MI300X FP32 (163.25 TFLOPS)', memory: 192, quantTypes: ['fp32'], type: 'gpu' },
  { value: '326.5,fp16', name: 'MI300X FP16 (326.5 TFLOPS)', memory: 192, quantTypes: ['fp16'], type: 'gpu' },
  { value: '653,int8', name: 'MI300X INT8 (653 TOPS)', memory: 192, quantTypes: ['int8'], type: 'gpu' },
  { value: '1306,int4', name: 'MI300X INT4 (1306 TOPS)', memory: 192, quantTypes: ['int4'], type: 'gpu' },
  // Intel Gaudi 3
  { value: '229,fp32', name: 'Gaudi 3 FP32 (229 TFLOPS)', memory: 128, quantTypes: ['fp32'], type: 'gpu' },
  { value: '1835,fp16', name: 'Gaudi 3 BF16 (1.835 PFLOPS)', memory: 128, quantTypes: ['fp16'], type: 'gpu' },
  { value: '1835,fp8', name: 'Gaudi 3 FP8 (1.835 PFLOPS)', memory: 128, quantTypes: ['fp8'], type: 'gpu' },
  { value: '1835,int8', name: 'Gaudi 3 INT8 (1.835 POPS)', memory: 128, quantTypes: ['int8'], type: 'gpu' },
  // Intel Gaudi 2
  { value: '432,fp16', name: 'Gaudi 2 BF16 (432 TFLOPS)', memory: 96, quantTypes: ['fp16'], type: 'gpu' },
  { value: '865,fp8', name: 'Gaudi 2 FP8 (865 TFLOPS)', memory: 96, quantTypes: ['fp8'], type: 'gpu' },
  { value: '865,int8', name: 'Gaudi 2 INT8 (865 TOPS)', memory: 96, quantTypes: ['int8'], type: 'gpu' },
  
  // Intel Xeon CPUs with AI Accelerators (5th Gen - Emerald Rapids)
  // Optimized for small GenAI models (<20B parameters), classical ML, vector search, RAG
  { value: '2.0,int8', name: 'Xeon 8592+ (64C) AMX INT8 (2 TOPS)', memory: 2048, quantTypes: ['int8'], type: 'cpu' },
  { value: '1.8,int8', name: 'Xeon 8580 (60C) AMX INT8 (1.8 TOPS)', memory: 2048, quantTypes: ['int8'], type: 'cpu' },
  { value: '1.6,int8', name: 'Xeon 8568Y+ (48C) AMX INT8 (1.6 TOPS)', memory: 2048, quantTypes: ['int8'], type: 'cpu' },
  { value: '1.4,int8', name: 'Xeon 8558 (48C) AMX INT8 (1.4 TOPS)', memory: 2048, quantTypes: ['int8'], type: 'cpu' },
  
  // Intel Xeon 6 Processors (6th Gen - 3nm, Multi-Die Architecture)
  // P-Core SKUs (Performance cores, up to 128 cores)
  { value: '3.5,int8', name: 'Xeon 6980P (128C P-Core) AMX INT8 (3.5 TOPS) 🆕', memory: 6144, quantTypes: ['int8'], type: 'cpu' },
  { value: '3.2,int8', name: 'Xeon 6972P (120C P-Core) AMX INT8 (3.2 TOPS) 🆕', memory: 6144, quantTypes: ['int8'], type: 'cpu' },
  { value: '2.8,int8', name: 'Xeon 6960P (96C P-Core) AMX INT8 (2.8 TOPS) 🆕', memory: 6144, quantTypes: ['int8'], type: 'cpu' },
  { value: '2.5,int8', name: 'Xeon 6952P (80C P-Core) AMX INT8 (2.5 TOPS) 🆕', memory: 6144, quantTypes: ['int8'], type: 'cpu' },
  { value: '2.2,int8', name: 'Xeon 6940P (64C P-Core) AMX INT8 (2.2 TOPS) 🆕', memory: 4096, quantTypes: ['int8'], type: 'cpu' },
  
  // Intel Xeon 6 Processors - E-Core SKUs (Efficiency cores, up to 288 cores)
  { value: '4.0,int8', name: 'Xeon 6980E (288C E-Core) AMX INT8 (4.0 TOPS) 🆕', memory: 6144, quantTypes: ['int8'], type: 'cpu' },
  { value: '3.8,int8', name: 'Xeon 6972E (256C E-Core) AMX INT8 (3.8 TOPS) 🆕', memory: 6144, quantTypes: ['int8'], type: 'cpu' },
  { value: '3.5,int8', name: 'Xeon 6960E (224C E-Core) AMX INT8 (3.5 TOPS) 🆕', memory: 6144, quantTypes: ['int8'], type: 'cpu' },
  { value: '3.2,int8', name: 'Xeon 6952E (192C E-Core) AMX INT8 (3.2 TOPS) 🆕', memory: 4096, quantTypes: ['int8'], type: 'cpu' },
  { value: '2.8,int8', name: 'Xeon 6940E (144C E-Core) AMX INT8 (2.8 TOPS) 🆕', memory: 4096, quantTypes: ['int8'], type: 'cpu' },
  
  // Intel Xeon 6 Features:
  // - Multi-Die Architecture: Scalable compute tiles
  // - Intel 3 Process (3nm): 1.7x density vs 5th Gen
  // - MR-DIMM Support: 2.3x memory bandwidth (P-cores)
  // - DDR5: 1.7x memory bandwidth vs 5th Gen
  // - PCIe 5.0: 1.2x I/O bandwidth
  // - UPI 2.0: 1.8x inter-socket bandwidth
  // - CXL 2.0: Type 1, 2, 3 support for memory expansion
  // - Up to 504MB LLC: Massive last-level cache
  // - Intel AMX: Advanced AI matrix acceleration
  // - Integrated Accelerators: QAT, IAA, DSA, DLB
  // - Socket Scalability: 1 to 8 sockets
  // - P-cores: Up to 128 cores, optimized for performance
  // - E-cores: Up to 288 cores, optimized for efficiency/throughput
  
  // Intel Xeon CPUs (4th Gen - Sapphire Rapids) with built-in AI acceleration
  { value: '1.5,int8', name: 'Xeon 8490H (60C) AMX INT8 (1.5 TOPS)', memory: 2048, quantTypes: ['int8'], type: 'cpu' },
  { value: '1.3,int8', name: 'Xeon 8480+ (56C) AMX INT8 (1.3 TOPS)', memory: 2048, quantTypes: ['int8'], type: 'cpu' },
  { value: '1.2,int8', name: 'Xeon 8470 (52C) AMX INT8 (1.2 TOPS)', memory: 2048, quantTypes: ['int8'], type: 'cpu' },
  { value: '1.0,int8', name: 'Xeon 8460Y+ (40C) AMX INT8 (1.0 TOPS)', memory: 2048, quantTypes: ['int8'], type: 'cpu' },
  
  // Intel Xeon CPUs (3rd Gen - Ice Lake) with AVX-512 VNNI
  { value: '0.8,int8', name: 'Xeon 8380 (40C) VNNI INT8 (0.8 TOPS)', memory: 2048, quantTypes: ['int8'], type: 'cpu' },
  { value: '0.7,int8', name: 'Xeon 8368 (38C) VNNI INT8 (0.7 TOPS)', memory: 2048, quantTypes: ['int8'], type: 'cpu' },
  { value: '0.6,int8', name: 'Xeon 8352Y (32C) VNNI INT8 (0.6 TOPS)', memory: 2048, quantTypes: ['int8'], type: 'cpu' },
  
  // Intel Xeon CPU Use Cases:
  // - Small GenAI Models: Llama 7B, Mistral 7B, Phi-3 8B (<20B parameters)
  // - Classical ML Models: Random Forest, XGBoost, LightGBM
  // - Data Analytics: Apache Spark, pandas operations
  // - Media Analytics: OpenVINO inference, video processing
  // - Vector Search & Embedding: RAG applications, semantic search
  // - Chatbot/Summarization: Models under 20B parameters
  // - VDI Workloads: Virtual Desktop Infrastructure with AI features
];