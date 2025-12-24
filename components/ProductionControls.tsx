'use client';
import React from 'react';

interface ProductionControlsProps {
  useProductionFramework: boolean;
  setUseProductionFramework?: (v: boolean) => void;
  isCPU: boolean;
  setIsCPU?: (v: boolean) => void;
  // Optional UI flags
  hideToggle?: boolean; // hide the top checkbox/device-type controls
  // User field customization
  userFieldLabel?: string; // label for the user/hardware field
  userFieldValue?: number; // value for the user/hardware field
  onUserFieldChange?: (v: number) => void; // change handler
  // GPU controls
  kernelEfficiency: number;
  setKernelEfficiency?: (v: number) => void;
  utilizationFactor: number;
  setUtilizationFactor?: (v: number) => void;
  attentionOverheadInput?: number;
  setAttentionOverhead?: (v: number) => void;
  prefillOverheadInput?: number;
  setPrefillOverhead?: (v: number) => void;
  // CPU controls
  cpuPrefillMultiplier?: number;
  setCpuPrefillMultiplier?: (v: number) => void;
  cpuRedundancy?: number;
  setCpuRedundancy?: (v: number) => void;
  cpuModelRamOverhead?: number;
  setCpuModelRamOverhead?: (v: number) => void;
}

export default function ProductionControls({
  useProductionFramework,
  setUseProductionFramework,
  isCPU,
  setIsCPU,
  hideToggle = false,
  userFieldLabel = "Number of Users",
  userFieldValue,
  onUserFieldChange,
  kernelEfficiency,
  setKernelEfficiency,
  utilizationFactor,
  setUtilizationFactor,
  attentionOverheadInput,
  setAttentionOverhead,
  prefillOverheadInput,
  setPrefillOverhead,
  cpuPrefillMultiplier,
  setCpuPrefillMultiplier,
  cpuRedundancy,
  setCpuRedundancy,
  cpuModelRamOverhead,
  setCpuModelRamOverhead,
}: ProductionControlsProps) {
  return (
    <>
      {!hideToggle && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="flex items-center gap-3 cursor-pointer font-bold text-indigo-900">
              <input
                type="checkbox"
                checked={useProductionFramework}
                onChange={(e) => setUseProductionFramework && setUseProductionFramework(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              />
              <span>Use Production-Grade Framework</span>
            </label>
            <p className="mt-2 ml-8 text-xs text-indigo-700 font-medium">Enable production-grade controls (kernel efficiency, utilization, redundancy, headroom)</p>
          </div>

          <div>
            <label htmlFor="calc_device_type" className="block text-sm font-medium text-slate-700">Device Type</label>
            <select
              id="calc_device_type"
              value={isCPU ? 'cpu' : 'gpu'}
              onChange={(e) => setIsCPU && setIsCPU(e.target.value === 'cpu')}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gpu">GPU</option>
              <option value="cpu">CPU</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Choose whether to calculate based on GPU or CPU efficiency</p>
          </div>
        </div>
      )}

      {useProductionFramework && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {isCPU ? (
            <div>
              <label htmlFor="pc_cpu_amx" className="block text-sm font-medium text-slate-700">AMX Efficiency</label>
              <input
                id="pc_cpu_amx"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={cpuPrefillMultiplier ? cpuPrefillMultiplier : 0.5}
                onChange={(e) => setCpuPrefillMultiplier && setCpuPrefillMultiplier(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label htmlFor="pc_cpu_prefill_mult" className="block text-sm font-medium text-slate-700 mt-3">CPU Prefill Multiplier</label>
              <input
                id="pc_cpu_prefill_mult"
                type="number"
                min={0}
                max={10}
                step={0.01}
                value={cpuPrefillMultiplier}
                onChange={(e) => setCpuPrefillMultiplier && setCpuPrefillMultiplier(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label htmlFor="pc_cpu_redundancy" className="block text-sm font-medium text-slate-700 mt-3">CPU Redundancy</label>
              <input
                id="pc_cpu_redundancy"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={cpuRedundancy}
                onChange={(e) => setCpuRedundancy && setCpuRedundancy(Math.min(1, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label htmlFor="pc_cpu_model_overhead" className="block text-sm font-medium text-slate-700 mt-3">CPU Model RAM Overhead</label>
              <input
                id="pc_cpu_model_overhead"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={cpuModelRamOverhead}
                onChange={(e) => setCpuModelRamOverhead && setCpuModelRamOverhead(Math.min(1, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="pc_kernel_eff" className="block text-sm font-medium text-slate-700">Kernel Efficiency</label>
              <input
                id="pc_kernel_eff"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={typeof kernelEfficiency === 'number' ? kernelEfficiency : 0.5}
                onChange={(e) => setKernelEfficiency && setKernelEfficiency(Math.min(1, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label htmlFor="pc_util_factor" className="block text-sm font-medium text-slate-700 mt-3">Utilization Factor</label>
              <input
                id="pc_util_factor"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={utilizationFactor}
                onChange={(e) => setUtilizationFactor && setUtilizationFactor(Math.min(1, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label htmlFor="pc_attention_overhead" className="block text-sm font-medium text-slate-700 mt-3">Attention Overhead</label>
              <input
                id="pc_attention_overhead"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={typeof attentionOverheadInput === 'number' ? attentionOverheadInput : 0.1}
                onChange={(e) => setAttentionOverhead && setAttentionOverhead(Math.min(1, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label htmlFor="pc_prefill_overhead" className="block text-sm font-medium text-slate-700 mt-3">Prefill Overhead</label>
              <input
                id="pc_prefill_overhead"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={typeof prefillOverheadInput === 'number' ? prefillOverheadInput : 0.1}
                onChange={(e) => setPrefillOverhead && setPrefillOverhead(Math.min(1, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
