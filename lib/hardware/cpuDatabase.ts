import { HardwareOption } from '../hardwareDatabase';

export const cpuDatabase: HardwareOption[] = [

  // ===== Xeon 6 – P-Core (Highest compute CPUs) =====
  { value: '6.144,compute', name: 'Xeon 6980P (Xeon 6, 128C P-Core) – 6.144 TFLOPS Peak', memory: 6144, quantTypes: ['int8', 'bf16', 'fp16'], type: 'cpu' },
  { value: '6.144,compute', name: 'Xeon 6979P (Xeon 6, 128C P-Core) – 6.144 TFLOPS Peak', memory: 6144, quantTypes: ['int8', 'bf16', 'fp16'], type: 'cpu' },
  { value: '5.837,compute', name: 'Xeon 6972P (Xeon 6, 120C P-Core) – 5.837 TFLOPS Peak', memory: 6144, quantTypes: ['int8', 'bf16', 'fp16'], type: 'cpu' },
  { value: '4.838,compute', name: 'Xeon 6960P (Xeon 6, 96C P-Core) – 4.838 TFLOPS Peak', memory: 6144, quantTypes: ['int8', 'bf16', 'fp16'], type: 'cpu' },
  { value: '4.301,compute', name: 'Xeon 6952P (Xeon 6, 80C P-Core) – 4.301 TFLOPS Peak', memory: 6144, quantTypes: ['int8', 'bf16', 'fp16'], type: 'cpu' },
  { value: '4.147,compute', name: 'Xeon 6944P (Xeon 6, 64C P-Core) – 4.147 TFLOPS Peak', memory: 4096, quantTypes: ['int8', 'bf16', 'fp16'], type: 'cpu' },

  // ===== Xeon 6 – E-Core =====
  { value: '4.128,compute', name: 'Xeon 6788P (Xeon 6, E-Core) – 4.128 TFLOPS Peak', memory: 3360, quantTypes: ['int8', 'bf16'], type: 'cpu' },
  { value: '4.128,compute', name: 'Xeon 6787P (Xeon 6, E-Core) – 4.128 TFLOPS Peak', memory: 3360, quantTypes: ['int8', 'bf16'], type: 'cpu' },
  { value: '3.891,compute', name: 'Xeon 6761P (Xeon 6, E-Core) – 3.891 TFLOPS Peak', memory: 3360, quantTypes: ['int8', 'bf16'], type: 'cpu' },

  // ===== Xeon Platinum 8500 (Emerald Rapids) =====
  { value: '3.277,compute', name: 'Xeon Platinum 8593Q – 3.277 TFLOPS Peak', memory: 2048, quantTypes: ['int8', 'bf16', 'fp16'], type: 'cpu' },
  { value: '2.867,compute', name: 'Xeon Platinum 8592V – 2.867 TFLOPS Peak', memory: 2048, quantTypes: ['int8', 'bf16', 'fp16'], type: 'cpu' },
  { value: '2.688,compute', name: 'Xeon Platinum 8580 – 2.688 TFLOPS Peak', memory: 2048, quantTypes: ['int8', 'bf16', 'fp16'], type: 'cpu' },

  // ===== Xeon CPU Max (HBM CPUs) =====
  { value: '2.330,compute', name: 'Xeon CPU Max 9480 – 2.330 TFLOPS Peak (HBM)', memory: 4096, quantTypes: ['bf16', 'fp16'], type: 'cpu' },
  { value: '2.304,compute', name: 'Xeon CPU Max 9468 – 2.304 TFLOPS Peak (HBM)', memory: 4096, quantTypes: ['bf16', 'fp16'], type: 'cpu' },

  // ===== Xeon Platinum 8300 (Ice Lake) =====
  { value: '2.304,compute', name: 'Xeon Platinum 8380 – 2.304 TFLOPS Peak', memory: 2048, quantTypes: ['int8'], type: 'cpu' },
  { value: '2.189,compute', name: 'Xeon Platinum 8368 – 2.189 TFLOPS Peak', memory: 2048, quantTypes: ['int8'], type: 'cpu' }
];
