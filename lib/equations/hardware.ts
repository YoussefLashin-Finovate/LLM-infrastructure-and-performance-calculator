// Hardware parsing helpers
// Provide a single, well-tested source of truth for parsing hardware spec strings like "h100-120t,int8"

export function parseHardwareOps(opsRaw: string): number {
  // Match number with optional suffix (K, M, G, T, P)
  const match = opsRaw.toUpperCase().match(/^([0-9]*\.?[0-9]+)\s*([KMGTP])?$/);
  if (match) {
    const val = parseFloat(match[1]);
    const suffix = match[2] || 'T';
    const scaleMap: { [key: string]: number } = {
      K: 1e3,
      M: 1e6,
      G: 1e9,
      T: 1e12,
      P: 1e15,
    };
    return val * (scaleMap[suffix] || 1e12);
  }
  // Fallback treat as tera
  return parseFloat(opsRaw) * 1e12;
}

export function extractOpsRawFromHardwareValue(hwValue: string): string {
  // Example hardware value: "h100-3958,int8" or "a800-1024"
  return (hwValue.split(',')[0].split('-').pop() || '0').toString().trim();
}

export function parseHardwareOpsFromValue(hwValue: string): number {
  const raw = extractOpsRawFromHardwareValue(hwValue);
  return parseHardwareOps(raw);
}
