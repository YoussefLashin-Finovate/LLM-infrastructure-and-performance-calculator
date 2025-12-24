import React from 'react';
import { QUANTIZATION_OPTIONS } from '@/lib/config';
import { QuantizationType } from '@/lib/types';

interface Props {
  id?: string;
  value: QuantizationType;
  onChange: (value: string) => void;
  label?: string;
}

export default function QuantizationSelect({ id = 'quantization', value, onChange, label = 'Quantization Level' }: Props) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none"
        >
          {QUANTIZATION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value} title={opt.name}>{opt.name}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
}
