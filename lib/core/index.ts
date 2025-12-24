/**
 * Unified Core Module
 * 
 * Single source of truth for LLM infrastructure calculations.
 * Both Capacity Planner and Performance Calculator use this module.
 */

export { calculateCore, calculateCapacity, calculatePerformanceFromCore } from './core';
export * from './constants';
export * from './equations';
export * from './types';
