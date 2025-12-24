'use client';

import React from 'react';

/**
 * Shared Token Configuration Component
 * 
 * Used by BOTH Capacity Planner and Performance Calculator.
 * Handles token-related inputs for KV cache sizing.
 */

export interface TokenConfigurationProps {
    // Token counts
    systemPromptTokens: number;
    setSystemPromptTokens: (value: number) => void;
    sessionHistoryTokens: number;
    setSessionHistoryTokens: (value: number) => void;
    newInputTokens: number;
    setNewInputTokens: (value: number) => void;
    avgResponseTokensPerRequest?: number;
    setAvgResponseTokensPerRequest?: (value: number) => void;

    // KV cache configuration
    offloadRatio?: number;
    setOffloadRatio?: (value: number) => void;
    activeKvFraction?: number;
    setActiveKvFraction?: (value: number) => void;
    showOffloadRatio?: boolean;
    showActiveKvFraction?: boolean;

    // Variant styling
    variant?: 'blue' | 'indigo' | 'emerald';
}

export default function TokenConfiguration({
    systemPromptTokens,
    setSystemPromptTokens,
    sessionHistoryTokens,
    setSessionHistoryTokens,
    newInputTokens,
    setNewInputTokens,
    avgResponseTokensPerRequest,
    setAvgResponseTokensPerRequest,
    offloadRatio,
    setOffloadRatio,
    activeKvFraction,
    setActiveKvFraction,
    showOffloadRatio = false,
    showActiveKvFraction = false,
    variant = 'indigo',
}: TokenConfigurationProps) {
    // Variant-specific colors
    const colors = variant === 'emerald' ? {
        bg: 'bg-emerald-50/50',
        border: 'border-emerald-200',
        titleText: 'text-emerald-900',
        labelText: 'text-emerald-800',
        inputBorder: 'border-emerald-300',
        inputRing: 'focus:ring-emerald-500',
        helperText: 'text-emerald-700',
    } : variant === 'blue' ? {
        bg: 'bg-blue-50/50',
        border: 'border-blue-200',
        titleText: 'text-blue-900',
        labelText: 'text-blue-800',
        inputBorder: 'border-blue-300',
        inputRing: 'focus:ring-blue-500',
        helperText: 'text-blue-700',
    } : {
        bg: 'bg-indigo-50/50',
        border: 'border-indigo-200',
        titleText: 'text-indigo-900',
        labelText: 'text-indigo-800',
        inputBorder: 'border-indigo-300',
        inputRing: 'focus:ring-indigo-500',
        helperText: 'text-indigo-700',
    };

    return (
        <div className={`rounded-lg p-4 border ${colors.bg} ${colors.border}`}>
            <h4 className={`font-bold mb-4 flex items-center gap-2 ${colors.titleText}`}>
                🧠 Token Configuration
            </h4>

            <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                    <label htmlFor="token_config_system" className={`block text-sm font-medium ${colors.labelText}`}>
                        System Prompt Tokens
                    </label>
                    <input
                        type="number"
                        id="token_config_system"
                        value={systemPromptTokens}
                        onChange={(e) => setSystemPromptTokens(parseInt(e.target.value) || 0)}
                        min="0"
                        className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                    />
                    <p className={`text-xs ${colors.helperText}`}>Cached system prompt tokens (not regenerated per request)</p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="token_config_history" className={`block text-sm font-medium ${colors.labelText}`}>
                        Session History Tokens
                    </label>
                    <input
                        type="number"
                        id="token_config_history"
                        value={sessionHistoryTokens}
                        onChange={(e) => setSessionHistoryTokens(parseInt(e.target.value) || 0)}
                        min="0"
                        className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                    />
                    <p className={`text-xs ${colors.helperText}`}>Conversation history tokens maintained in KV cache</p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="token_config_input" className={`block text-sm font-medium ${colors.labelText}`}>
                        New Input Tokens (per request)
                    </label>
                    <input
                        type="number"
                        id="token_config_input"
                        value={newInputTokens}
                        onChange={(e) => setNewInputTokens(parseInt(e.target.value) || 0)}
                        min="0"
                        className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                    />
                    <p className={`text-xs ${colors.helperText}`}>New user input tokens processed per request</p>
                </div>

                {setAvgResponseTokensPerRequest && avgResponseTokensPerRequest !== undefined && (
                    <div className="space-y-2">
                        <label htmlFor="token_config_response" className={`block text-sm font-medium ${colors.labelText}`}>
                            Avg Response Tokens per Request
                        </label>
                        <input
                            type="number"
                            id="token_config_response"
                            value={avgResponseTokensPerRequest}
                            onChange={(e) => setAvgResponseTokensPerRequest(parseInt(e.target.value) || 50)}
                            min="0"
                            className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                        />
                        <p className={`text-xs ${colors.helperText}`}>Average output tokens per request — used for prefill calculations</p>
                    </div>
                )}

                {showOffloadRatio && setOffloadRatio && offloadRatio !== undefined && (
                    <div className="space-y-2">
                        <label htmlFor="token_config_offload" className={`block text-sm font-medium ${colors.labelText}`}>
                            KV Cache Offload Ratio
                        </label>
                        <input
                            type="number"
                            id="token_config_offload"
                            value={offloadRatio}
                            onChange={(e) => setOffloadRatio(parseFloat(e.target.value) || 0)}
                            min="0"
                            max="1"
                            step="0.1"
                            className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                        />
                        <p className={`text-xs ${colors.helperText}`}>0 = no offload, 1 = full offload to CPU/NVMe</p>
                    </div>
                )}

                {showActiveKvFraction && setActiveKvFraction && activeKvFraction !== undefined && (
                    <div className="space-y-2">
                        <label htmlFor="token_config_active_kv" className={`block text-sm font-medium ${colors.labelText}`}>
                            Active KV Fraction (%)
                        </label>
                        <input
                            type="number"
                            id="token_config_active_kv"
                            value={activeKvFraction * 100}
                            onChange={(e) => setActiveKvFraction(parseFloat(e.target.value) / 100 || 0.05)}
                            min="0"
                            max="100"
                            step="1"
                            className={`w-full px-3 py-2 bg-white border ${colors.inputBorder} rounded-md text-sm focus:outline-none focus:ring-2 ${colors.inputRing}`}
                        />
                        <p className={`text-xs ${colors.helperText}`}>Fraction of users with active KV cache in memory</p>
                    </div>
                )}
            </div>
        </div>
    );
}
