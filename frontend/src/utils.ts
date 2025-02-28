export function roundToNearestNDigits(num: number, n: number): string {
  return (Math.round(num * 100) / 100).toFixed(n);
}

// E.g., 15234 -> 15,234
export function addCommasToNumber(num: number): string {
  return num.toLocaleString();
}
