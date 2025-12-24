import { ReverseCalculatorInputs, ReverseCalculatorResults } from '../types';
import { calculateLlmInfrastructure } from './llmInfrastructure';

/**
 * Deprecated compatibility wrapper.
 * Use `calculateLlmInfrastructure` from `lib/calculations/llmInfrastructure` instead.
 */
export function calculateReverseInfrastructure(inputs: ReverseCalculatorInputs): ReverseCalculatorResults {
  // Log a non-fatal deprecation warning for callers still using the old API.
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn('[DEPRECATION] calculateReverseInfrastructure is deprecated — use calculateLlmInfrastructure from lib/calculations/llmInfrastructure instead. This wrapper forwards to the new implementation.');
  }

  // Forward to the new implementation for backward compatibility.
  return calculateLlmInfrastructure(inputs as any) as ReverseCalculatorResults;
}
