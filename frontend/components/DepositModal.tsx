"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { useMintPTYT } from "@/hooks/useMintPTYT";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function DepositModal({ open, onClose }: Props) {
  const [amount, setAmount] = useState("");
  const [maturity, setMaturity] = useState("90");
  const [error, setError] = useState("");
  const { deposit, isLoading, isSuccess } = useMintPTYT();

  if (!open) return null;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError("Enter a deposit amount greater than zero.");
      return;
    }
    setError("");
    maturity;
    deposit(amount);
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
            <p className="font-medium">Position submitted</p>
            <p className="mt-1 text-sm text-muted-foreground">Your wallet transaction confirmed. The dashboard will refresh shortly.</p>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="pool" className="text-sm font-medium">Pool</label>
            <select
              id="pool"
              className="min-h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option>ETH / USDC</option>
              <option>wBTC / USDC</option>
              <option>wstETH / USDC</option>
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
              value={maturity}
              onChange={(event) => setMaturity(event.target.value)}
              className="min-h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
            </select>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
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

