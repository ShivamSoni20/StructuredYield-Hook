"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useMintPTYT } from "@/hooks/useMintPTYT";
import { DEMO_MARKETS } from "@/lib/demo";
import { formatBps, formatCurrency, parseDepositAmount } from "@/lib/math";

type Props = {
  open: boolean;
  onClose: () => void;
  poolId?: `0x${string}`;
  onSuccess?: () => void;
};

export function DepositModal({ open, onClose, poolId, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [maturityDays, setMaturityDays] = useState("90");
  const [selectedPool, setSelectedPool] = useState<`0x${string}`>(poolId ?? DEMO_MARKETS[0].poolId);
  const [error, setError] = useState("");
  const { deposit, isLoading, isSuccess, hash, lastMaturityDays } = useMintPTYT();

  const parsedAmount = parseDepositAmount(amount);
  const maturityNumber = Number(maturityDays);
  const estimatedYT = parsedAmount > 0n ? (parsedAmount * BigInt(maturityNumber)) / 365n : 0n;
  const selectedMarket = DEMO_MARKETS.find((market) => market.poolId === selectedPool) ?? DEMO_MARKETS[0];
  const premiumBps = BigInt(selectedMarket.premiumBps);
  const premium = parsedAmount > 0n ? (parsedAmount * premiumBps) / 10_000n : 0n;

  useEffect(() => {
    if (isSuccess) onSuccess?.();
  }, [isSuccess, onSuccess]);

  if (!open) return null;

  function resetAndClose() {
    setAmount("");
    setMaturityDays("90");
    setError("");
    onClose();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError("Enter a deposit amount greater than zero.");
      return;
    }
    setError("");
    deposit(amount, selectedPool, maturityNumber);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" role="presentation">
      <section className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg" role="dialog" aria-modal="true" aria-labelledby="deposit-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="deposit-title" className="text-xl font-semibold">Deposit and mint PT/YT</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create a structured LP position in one transaction.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Close deposit dialog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {isSuccess ? (
          <div className="mt-6 rounded-lg border bg-secondary p-4">
            <p className="font-medium">PT-LP and YT-LP minted</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your {lastMaturityDays} day position was submitted. The dashboard will refresh shortly.
            </p>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="pool" className="text-sm font-medium">Pool</label>
            <select
              id="pool"
              value={selectedPool}
              onChange={(event) => setSelectedPool(event.target.value as `0x${string}`)}
              className="min-h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {DEMO_MARKETS.map((market) => (
                <option key={market.poolId} value={market.poolId}>{market.pair}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="amount" className="text-sm font-medium">Deposit amount</label>
            <input
              id="amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              placeholder="50000"
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "amount-error" : "amount-hint"}
              className="min-h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {error ? (
              <p id="amount-error" className="text-xs text-destructive">{error}</p>
            ) : (
              <p id="amount-hint" className="text-xs text-muted-foreground">Demo uses 18 decimals until pool tokens are configured.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="maturity" className="text-sm font-medium">Maturity</label>
            <select
              id="maturity"
              value={maturityDays}
              onChange={(event) => setMaturityDays(event.target.value)}
              className="min-h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
            </select>
          </div>

          <div className="rounded-lg border bg-secondary/40 p-4 text-sm">
            <p className="font-medium">Live preview</p>
            <dl className="mt-3 grid gap-2">
              <PreviewRow label="PT-LP to receive" value={formatCurrency(parsedAmount)} />
              <PreviewRow label="YT-LP to receive" value={formatCurrency(estimatedYT)} />
              <PreviewRow label="Estimated fixed APY" value={formatBps(selectedMarket.premiumBps)} />
              <PreviewRow label="Insurance premium" value={formatCurrency(premium)} />
            </dl>
          </div>

          {hash ? (
            <p className="rounded-md border bg-secondary/40 p-3 font-mono text-xs text-muted-foreground">
              Pending tx: {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetAndClose}
              className="min-h-10 rounded-md border px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Minting..." : "Deposit & mint"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono font-semibold">{value}</dd>
    </div>
  );
}
