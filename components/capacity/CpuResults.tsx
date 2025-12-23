'use client';

import React from 'react';
import { formatFLOPS } from '@/lib/equations/format';

interface CpuSizing {
  modelRamGB: number;
  kvTotalGB?: number;
  kvActiveGB?: number;
  totalMemoryGB?: number;
  memoryPerCPU?: number;
  flopsPerTokenGFLOPS: number;
  totalFlopsTFLOPS: number;
  usableFlopsPerCPU?: number;
  targetTPSPerCPU?: number;
  cpusCompute: number;
  cpusDecode: number;
  M_prefill: number;
  cpusWithPrefill: number;
  U_target: number;
  redundancy: number;
  finalCPUs: number;
  finalCPUsRounded: number;
  deliveredTPS: number;
  sanityPass: boolean;
  notes?: string[];
}

function safeNum(value: number | undefined, decimals: number = 1): string {
  if (value === undefined || isNaN(value) || !isFinite(value)) return 'N/A';
  return value.toFixed(decimals);
}

export default function CpuResults({ cpuSizing }: { cpuSizing?: CpuSizing }) {
  if (!cpuSizing) return null;

  return (
    <>
      <div className="p-5 rounded-xl bg-gradient-to-br from-orange-50 to-white border border-orange-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl opacity-60 -mr-6 -mt-6 pointer-events-none"></div>
        <div className="text-sm font-semibold text-orange-500 mb-1 uppercase tracking-wide relative z-10">CPU Units Needed</div>
        <div className="text-4xl font-extrabold text-orange-900 mb-2 relative z-10">{cpuSizing.finalCPUsRounded} <span className="text-lg font-normal text-orange-600">x CPUs</span></div>
        <div className="text-xs text-orange-600 font-medium bg-white/80 p-2 rounded-lg border border-orange-200 inline-block backdrop-blur-sm relative z-10">
          Delivered Throughput: <span className="font-bold text-orange-600">{safeNum(cpuSizing.deliveredTPS,1)}</span> tokens/sec total
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-100">
          <div className="text-xs text-orange-700 font-semibold uppercase mb-1">Model RAM</div>
          <div className="text-xl font-bold text-orange-900">{safeNum(cpuSizing.modelRamGB,1)} GB</div>
          <div className="text-sm mt-2">KV Cache (worst-case, total): <span className="font-semibold">{safeNum(cpuSizing.kvTotalGB,2)} GB</span></div>
          <div className="text-sm mt-1">Effective KV (active {cpuSizing.kvTotalGB && cpuSizing.kvTotalGB > 0 ? ((Number(cpuSizing.kvActiveGB || 0) / Number(cpuSizing.kvTotalGB || 1)) * 100).toFixed(1) : (cpuSizing.kvActiveGB ? '100.0' : 'N/A')}%): <span className="font-semibold">{safeNum((cpuSizing as any).kvActiveGB,2)} GB</span> <span className="text-xs text-slate-500 ml-2">(used to compute Total Memory & Memory / CPU)</span></div>
          {cpuSizing.kvTotalGB && cpuSizing.kvTotalGB > 0 && (
            <div className="text-sm mt-1 text-amber-700">KV Offloaded: <span className="font-semibold">System RAM (100%)</span></div>
          )}
          <div className="text-sm">Total Memory (Model + Effective KV): <span className="font-semibold">{safeNum(cpuSizing.totalMemoryGB,2)} GB</span></div>
          <div className="text-sm">Memory / CPU: <span className="font-semibold">{safeNum(cpuSizing.memoryPerCPU,2)} GB</span></div>
        </div>
        <div className="p-3 rounded-lg bg-red-50/50 border border-red-100">
          <div className="text-xs text-red-700 font-semibold uppercase mb-1">FLOPs/Token</div>
          <div className="text-xl font-bold text-red-900">{formatFLOPS(cpuSizing.flopsPerTokenGFLOPS * 1e9)}</div>
          <div className="text-sm mt-2">Computed TPS / CPU: <span className="font-semibold">{cpuSizing.targetTPSPerCPU?.toFixed(6) || 'N/A'}</span></div>
        </div>
      </div>

      <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-200 mt-4">
        <h4 className="font-bold text-orange-900 text-sm mb-3 flex items-center gap-2">
          <span>🖥️</span> CPU Sizing Breakdown
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-orange-100 pb-1">
            <span className="text-orange-700">Compute CPUs</span>
            <span className="font-mono text-orange-900 font-semibold">{cpuSizing.cpusCompute}</span>
          </div>
          <div className="flex justify-between border-b border-orange-100 pb-1">
            <span className="text-orange-700">Decode/Prefill Adjusted CPUs</span>
            <span className="font-mono text-orange-900 font-semibold">{cpuSizing.cpusWithPrefill}</span>
          </div>
          <div className="flex justify-between border-b border-orange-100 pb-1">
            <span className="text-orange-700">Final CPUs (with redundancy)</span>
            <span className="font-mono text-orange-900 font-bold">{cpuSizing.finalCPUsRounded}</span>
          </div>

          {cpuSizing.notes && cpuSizing.notes.length > 0 && (
            <div className="mt-3 text-xs text-slate-600">
              <strong>Notes:</strong>
              <ul className="list-disc ml-4 mt-2">
                {cpuSizing.notes.map((note, i) => <li key={i}>{note}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
