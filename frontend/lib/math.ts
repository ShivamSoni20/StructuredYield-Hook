import { formatUnits, parseUnits } from "viem";

export function formatCurrency(value?: bigint, decimals = 18) {
  const numeric = Number(formatUnits(value ?? 0n, decimals));
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: numeric >= 1000 ? 0 : 2
  }).format(numeric);
}

export function formatBps(value?: bigint | number) {
  const numeric = typeof value === "bigint" ? Number(value) : value ?? 0;
  return `${(numeric / 100).toFixed(2)}%`;
}

export function formatDuration(seconds?: bigint | number) {
  const numeric = typeof seconds === "bigint" ? Number(seconds) : seconds ?? 0;
  const days = Math.max(0, Math.ceil(numeric / 86_400));
  if (days === 0) return "Matured";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function parseDepositAmount(amount: string) {
  if (!amount || Number.isNaN(Number(amount))) return 0n;
  return parseUnits(amount, 18);
}

