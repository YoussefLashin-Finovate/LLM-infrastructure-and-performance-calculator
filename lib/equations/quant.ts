export type NormalizedQuant = 'fp16' | 'int8' | 'int4';

export function normalizeQuantType(q: string | undefined): NormalizedQuant {
  if (!q) return 'fp16';
  const ql = q.toString().toLowerCase();
  if (ql === 'fp16' || ql === 'fp32') return 'fp16';
  if (ql === 'int8') return 'int8';
  if (ql === 'int4' || ql === 'q4_k_s') return 'int4';
  // Default fallback
  return 'fp16';
}