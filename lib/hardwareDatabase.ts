export interface HardwareOption {
  value: string;
  name: string;
  memory: number; // GPU: VRAM in GB, CPU: Max System RAM in GB
  quantTypes: string[];
  type?: 'gpu' | 'cpu'; // Hardware type
}


  
import { gpuDatabase } from './hardware/gpuDatabase';
import { cpuDatabase } from './hardware/cpuDatabase';

export const hardwareDatabase: HardwareOption[] = [
  ...gpuDatabase,
  ...cpuDatabase
];