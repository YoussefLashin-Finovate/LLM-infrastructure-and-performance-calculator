'use client';

import React from 'react';
import { useHardwareGroups } from '@/hooks/useHardwareFilter';
import { hardwareDatabase } from '@/lib/hardwareDatabase';

/**
 * Shared GPU Selector Component
 * 
 * Used by BOTH Capacity Planner and Performance Calculator.
 * Ensures identical hardware selection and efficiency parameters.
 */

export interface GpuSelectorProps {
    // Hardware selection
    hardware: string;
    setHardware: (value: string) => void;
    quantization: string;

    // GPU count (performance mode only)
    units?: number;
    setUnits?: (value: number) => void;
    showUnits?: boolean;
    unitsLabel?: string;

    // Efficiency parameters
    kernelEfficiency: number;
    setKernelEfficiency: (value: number) => void;
    utilizationFactor: number;
    setUtilizationFactor: (value: number) => void;

    // Overhead parameters
    attentionOverhead: number;
    setAttentionOverhead: (value: number) => void;
    prefillOverhead: number;
    setPrefillOverhead: (value: number) => void;

    // Headroom (capacity mode only)
    targetHeadroom?: number;
    setTargetHeadroom?: (value: number) => void;
    showHeadroom?: boolean;

    // Token throughput (both modes)
    tokensPerSecPerUser?: number;
    setTokensPerSecPerUser?: (value: number) => void;

    // Variant styling
    variant?: 'blue' | 'indigo';
}

// Get hardware type from hardware value string
function getHardwareType(hardwareValue: string): 'gpu' | 'cpu' {
    const hw = hardwareDatabase.find(h => h.value === hardwareValue);
    return hw?.type || 'gpu';
}

export default function GpuSelector({
    hardware,
    setHardware,
    quantization,
    units = 1,
    setUnits,
    showUnits = false,
    unitsLabel = 'Number of GPUs',
    kernelEfficiency,
    setKernelEfficiency,
    utilizationFactor,
    setUtilizationFactor,
    attentionOverhead,
    setAttentionOverhead,
    prefillOverhead,
    setPrefillOverhead,
    targetHeadroom,
    setTargetHeadroom,
    showHeadroom = false,
    tokensPerSecPerUser,
    setTokensPerSecPerUser,
    variant = 'blue',
}: GpuSelectorProps) {
    const hardwareGroups = useHardwareGroups(quantization);
    const selectedHW = hardwareDatabase.find(hw => hw.value === hardware);

    // Variant-specific colors
    const colors = variant === 'indigo' ? {
        bg: 'bg-gradient-to-r from-indigo-50 to-blue-50',
        border: 'border-indigo-200',
        titleText: 'text-indigo-900',
        labelText: 'text-indigo-800',
        inputBorder: 'border-indigo-300',
        inputRing: 'focus:ring-indigo-500',
        helperText: 'text-indigo-600',
    } : {
        bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
        border: 'border-blue-200',
        titleText: 'text-blue-900',
        labelText: 'text-blue-800',
        inputBorder: 'border-blue-300',
        inputRing: 'focus:ring-blue-500',
        helperText: 'text-blue-600',
    };

    return (
        <div className={`rounded-lg p-4 border ${colors.bg} ${colors.border}`}>
            <h4 className={`font-bold mb-4 flex items-center gap-2 ${colors.titleText}`}>
                🚀 GPU Configuration
            </h4>

            {/* Hardware Selection */}
            <div className="space-y-2 mb-4">
                <label htmlFor="gpu_selector_hardware" className={`block text-sm font-medium ${colors.labelText}`}>
                    Select Hardware
                </label>
                <select
                    id="gpu_selector_hardware"
                    value={hardware}
                    onChange={(e) => setHardware(e.target.value)}
                    className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                >
                    {hardwareGroups.map(group => (
                        <optgroup key={group.family} label={group.family}>
                            {group.options.map((hw, idx) => (
                                <option key={idx} value={hw.value}>
                                    {hw.name} - {hw.memory}GB
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <p className={`text-xs ${colors.helperText}`}>
                    Selected: {selectedHW?.name || 'Unknown'} ({selectedHW?.memory}GB VRAM)
                </p>
            </div>

            {/* Units & Throughput Row */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {showUnits && setUnits && (
                    <div className="space-y-2">
                        <label htmlFor="gpu_selector_units" className={`block text-sm font-medium ${colors.labelText}`}>
                            {unitsLabel}
                        </label>
                        <input
                            type="number"
                            id="gpu_selector_units"
                            value={units}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setUnits(isNaN(val) ? 1 : val);
                            }}
                            min="1"
                            className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                        />
                    </div>
                )}

                {setTokensPerSecPerUser && tokensPerSecPerUser !== undefined && (
                    <div className="space-y-2">
                        <label htmlFor="gpu_selector_tps" className={`block text-sm font-medium ${colors.labelText}`}>
                            Tokens/sec per User
                        </label>
                        <input
                            type="number"
                            id="gpu_selector_tps"
                            value={tokensPerSecPerUser}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setTokensPerSecPerUser(isNaN(val) ? 10 : val);
                            }}
                            min="0.1"
                            step="0.1"
                            className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                        />
                    </div>
                )}
            </div>

            {/* Efficiency & Utilization */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                    <label htmlFor="gpu_selector_kernel_eff" className={`block text-sm font-medium ${colors.labelText}`}>
                        Kernel Efficiency
                    </label>
                    <input
                        type="number"
                        id="gpu_selector_kernel_eff"
                        value={kernelEfficiency}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setKernelEfficiency(isNaN(val) ? 0.5 : val);
                        }}
                        min="0.1"
                        max="1"
                        step="0.05"
                        className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                    />
                    <p className={`text-xs ${colors.helperText}`}>Fraction of peak FLOPs achievable (0.1-1.0)</p>
                </div>
                <div className="space-y-2">
                    <label htmlFor="gpu_selector_util" className={`block text-sm font-medium ${colors.labelText}`}>
                        Utilization Factor
                    </label>
                    <input
                        type="number"
                        id="gpu_selector_util"
                        value={utilizationFactor}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setUtilizationFactor(isNaN(val) ? 0.8 : val);
                        }}
                        min="0.1"
                        max="1"
                        step="0.05"
                        className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                    />
                    <p className={`text-xs ${colors.helperText}`}>Overall system utilization (0.1-1.0)</p>
                </div>
            </div>

            {/* Overheads */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                    <label htmlFor="gpu_selector_attn_oh" className={`block text-sm font-medium ${colors.labelText}`}>
                        Attention Overhead
                    </label>
                    <input
                        type="number"
                        id="gpu_selector_attn_oh"
                        value={attentionOverhead}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setAttentionOverhead(isNaN(val) ? 0.1 : val);
                        }}
                        min="0"
                        max="1"
                        step="0.05"
                        className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                    />
                    <p className={`text-xs ${colors.helperText}`}>Additional overhead for attention (0-1.0)</p>
                </div>
                <div className="space-y-2">
                    <label htmlFor="gpu_selector_prefill_oh" className={`block text-sm font-medium ${colors.labelText}`}>
                        Prefill Overhead
                    </label>
                    <input
                        type="number"
                        id="gpu_selector_prefill_oh"
                        value={prefillOverhead}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setPrefillOverhead(isNaN(val) ? 0.1 : val);
                        }}
                        min="0"
                        max="1"
                        step="0.05"
                        className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                    />
                    <p className={`text-xs ${colors.helperText}`}>Additional overhead for prefill (0-1.0)</p>
                </div>
            </div>

            {/* Headroom (Capacity mode only) */}
            {showHeadroom && setTargetHeadroom && targetHeadroom !== undefined && (
                <div className="space-y-2">
                    <label htmlFor="gpu_selector_headroom" className={`block text-sm font-medium ${colors.labelText}`}>
                        Target Headroom
                    </label>
                    <input
                        type="number"
                        id="gpu_selector_headroom"
                        value={targetHeadroom}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setTargetHeadroom(isNaN(val) ? 0.1 : val);
                        }}
                        min="0"
                        max="1"
                        step="0.05"
                        className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                    />
                    <p className={`text-xs ${colors.helperText}`}>Extra capacity buffer (0-0.5)</p>
                </div>
            )}
        </div>
    );
}
