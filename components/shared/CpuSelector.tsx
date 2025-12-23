'use client';

import React from 'react';

/**
 * Shared CPU Selector Component
 * 
 * Used by BOTH Capacity Planner and Performance Calculator.
 * Ensures identical CPU configuration parameters across both tools.
 */

export interface CpuSelectorProps {
    // CPU count (for performance mode)
    units?: number;
    setUnits?: (value: number) => void;
    showUnits?: boolean;

    // Token throughput
    tokensPerSecPerUser?: number;
    setTokensPerSecPerUser?: (value: number) => void;

    // CPU-specific performance parameters
    cpuPrefillMultiplier: number;
    setCpuPrefillMultiplier: (value: number) => void;
    cpuUtilizationTarget: number;
    setCpuUtilizationTarget: (value: number) => void;
    cpuRedundancy: number;
    setCpuRedundancy: (value: number) => void;
    cpuAMXEfficiency: number;
    setCpuAMXEfficiency: (value: number) => void;
    cpuModelRamOverhead: number;
    setCpuModelRamOverhead: (value: number) => void;

    // Token configuration for KV cache
    systemPromptTokens: number;
    setSystemPromptTokens: (value: number) => void;
    sessionHistoryTokens: number;
    setSessionHistoryTokens: (value: number) => void;
    newInputTokens: number;
    setNewInputTokens: (value: number) => void;

    // Active KV fraction (shared with GPU mode)
    activeKvFraction?: number;
    setActiveKvFraction?: (value: number) => void;
    showActiveKvFraction?: boolean;
}

export default function CpuSelector({
    units = 1,
    setUnits,
    showUnits = false,
    tokensPerSecPerUser,
    setTokensPerSecPerUser,
    cpuPrefillMultiplier,
    setCpuPrefillMultiplier,
    cpuUtilizationTarget,
    setCpuUtilizationTarget,
    cpuRedundancy,
    setCpuRedundancy,
    cpuAMXEfficiency,
    setCpuAMXEfficiency,
    cpuModelRamOverhead,
    setCpuModelRamOverhead,
    systemPromptTokens,
    setSystemPromptTokens,
    sessionHistoryTokens,
    setSessionHistoryTokens,
    newInputTokens,
    setNewInputTokens,
    activeKvFraction,
    setActiveKvFraction,
    showActiveKvFraction = false,
}: CpuSelectorProps) {
    return (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
            <h4 className="text-orange-900 font-bold mb-4 flex items-center gap-2">
                🖥️ CPU Configuration
            </h4>

            {/* Units & Throughput Row */}
            {(showUnits || setTokensPerSecPerUser) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {showUnits && setUnits && (
                        <div className="space-y-2">
                            <label htmlFor="cpu_selector_units" className="block text-sm font-medium text-orange-800">
                                Number of CPUs
                            </label>
                            <input
                                type="number"
                                id="cpu_selector_units"
                                value={units}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setUnits(isNaN(val) ? 1 : val);
                                }}
                                min="1"
                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    )}

                    {setTokensPerSecPerUser && tokensPerSecPerUser !== undefined && (
                        <div className="space-y-2">
                            <label htmlFor="cpu_selector_tps" className="block text-sm font-medium text-orange-800">
                                Tokens/sec per User
                            </label>
                            <input
                                type="number"
                                id="cpu_selector_tps"
                                value={tokensPerSecPerUser}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setTokensPerSecPerUser(isNaN(val) ? 10 : val);
                                }}
                                min="0.1"
                                step="0.1"
                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* CPU Performance Parameters */}
            <div className="bg-orange-50/50 rounded-lg p-4 border border-orange-200 mb-4">
                <h5 className="text-sm font-semibold text-orange-800 mb-3">CPU Performance Parameters</h5>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="cpu_prefill_multiplier" className="block text-sm font-medium text-orange-700">
                            Prefill Multiplier
                        </label>
                        <input
                            type="number"
                            id="cpu_prefill_multiplier"
                            value={cpuPrefillMultiplier}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setCpuPrefillMultiplier(isNaN(val) ? 1.5 : val);
                            }}
                            min="1"
                            step="0.1"
                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-orange-600">Long-context prefill penalty multiplier</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cpu_utilization_target" className="block text-sm font-medium text-orange-700">
                            Utilization Target (%)
                        </label>
                        <input
                            type="number"
                            id="cpu_utilization_target"
                            value={cpuUtilizationTarget * 100}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) / 100;
                                setCpuUtilizationTarget(isNaN(val) ? 0.65 : val);
                            }}
                            min="10"
                            max="100"
                            step="5"
                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-orange-600">Target CPU utilization (default 65%)</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cpu_redundancy" className="block text-sm font-medium text-orange-700">
                            Redundancy Factor (%)
                        </label>
                        <input
                            type="number"
                            id="cpu_redundancy"
                            value={cpuRedundancy * 100}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) / 100;
                                setCpuRedundancy(isNaN(val) ? 0.1 : val);
                            }}
                            min="0"
                            max="100"
                            step="5"
                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-orange-600">Extra capacity for maintenance/failover</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cpu_amx_eff" className="block text-sm font-medium text-orange-700">
                            AMX Efficiency (%)
                        </label>
                        <input
                            type="number"
                            id="cpu_amx_eff"
                            value={cpuAMXEfficiency * 100}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) / 100;
                                setCpuAMXEfficiency(isNaN(val) ? 0.2 : val);
                            }}
                            min="1"
                            max="100"
                            step="5"
                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-orange-600">Intel AMX matrix efficiency</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cpu_model_ram_overhead" className="block text-sm font-medium text-orange-700">
                            Model RAM Overhead (%)
                        </label>
                        <input
                            type="number"
                            id="cpu_model_ram_overhead"
                            value={cpuModelRamOverhead * 100}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) / 100;
                                setCpuModelRamOverhead(isNaN(val) ? 0.2 : val);
                            }}
                            min="0"
                            max="50"
                            step="5"
                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-orange-600">Additional RAM overhead for model loading</p>
                    </div>

                    {showActiveKvFraction && setActiveKvFraction && activeKvFraction !== undefined && (
                        <div className="space-y-2">
                            <label htmlFor="cpu_active_kv" className="block text-sm font-medium text-orange-700">
                                Active KV Fraction (%)
                            </label>
                            <input
                                type="number"
                                id="cpu_active_kv"
                                value={activeKvFraction * 100}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) / 100;
                                    setActiveKvFraction(isNaN(val) ? 0.05 : val);
                                }}
                                min="0"
                                max="100"
                                step="1"
                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <p className="text-xs text-orange-600">Fraction of users with active KV cache</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Token Configuration for KV Cache */}
            <div className="bg-orange-100/50 rounded-lg p-4 border border-orange-200">
                <h5 className="text-sm font-semibold text-orange-800 mb-3">Token Configuration (KV Cache)</h5>
                <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                        <label htmlFor="cpu_system_prompt_tokens" className="block text-sm font-medium text-orange-700">
                            System Prompt Tokens
                        </label>
                        <input
                            type="number"
                            id="cpu_system_prompt_tokens"
                            value={systemPromptTokens || 10000}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setSystemPromptTokens(isNaN(val) ? 10000 : val);
                            }}
                            min="0"
                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-orange-600">Cached system prompt tokens (not regenerated per request)</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cpu_session_history_tokens" className="block text-sm font-medium text-orange-700">
                            Session History Tokens
                        </label>
                        <input
                            type="number"
                            id="cpu_session_history_tokens"
                            value={sessionHistoryTokens || 10000}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setSessionHistoryTokens(isNaN(val) ? 10000 : val);
                            }}
                            min="0"
                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-orange-600">Conversation history tokens in KV cache</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cpu_new_input_tokens" className="block text-sm font-medium text-orange-700">
                            New Input Tokens (per request)
                        </label>
                        <input
                            type="number"
                            id="cpu_new_input_tokens"
                            value={newInputTokens || 100}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setNewInputTokens(isNaN(val) ? 100 : val);
                            }}
                            min="0"
                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <p className="text-xs text-orange-600">New user input tokens processed per request</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
