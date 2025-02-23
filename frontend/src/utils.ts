export function roundToNearestNDigits(num: number, n: number): string {
  return (Math.round(num * 100) / 100).toFixed(n);
}
