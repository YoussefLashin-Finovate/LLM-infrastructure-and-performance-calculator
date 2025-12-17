export interface ModelArchitecture {
  layers: number;
  hiddenSize: number;
  kvHeads: number;
  queryHeads: number;
  intermediateSize?: number;
  // MoE-specific parameters
  isMoE?: boolean;
  totalExperts?: number;
  activeExperts?: number;
  expertParallelism?: boolean;
}
