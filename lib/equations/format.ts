export function formatFLOPS(value: number): string {
  if (value >= 1e15) return `${(value / 1e15).toFixed(2)} PFLOPS`;
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)} TFLOPS`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)} GFLOPS`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)} MFLOPS`;
  return `${value.toFixed(2)} FLOPS`;
}

export function formatMemory(valueGB: number): string {
  if (valueGB >= 1000) return `${(valueGB / 1000).toFixed(2)} TB`;
  if (valueGB >= 1) return `${valueGB.toFixed(1)} GB`;
  return `${(valueGB * 1024).toFixed(0)} MB`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals: number = 0): string {
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
