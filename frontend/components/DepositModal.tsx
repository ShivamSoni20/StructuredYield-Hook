"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatUnits } from "viem";
import { useMintPTYT } from "@/hooks/useMintPTYT";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { SY_ROUTER, USE_REAL_V4, USDC_ADDRESS, WETH_ADDRESS } from "@/lib/contracts";
import { DEMO_MARKETS } from "@/lib/demo";
import { formatBps, formatCurrency, parseDepositAmount } from "@/lib/math";

type Props = {
  open: boolean;
  onClose: () => void;
  mode?: "new-position" | "add-liquidity";
  poolId?: `0x${string}`;
  onSuccess?: () => void;
};

export function DepositModal({ open, onClose, mode = "new-position", poolId, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [maturityDays, setMaturityDays] = useState("90");
  const [selectedPool, setSelectedPool] = useState<`0x${string}`>(poolId ?? DEMO_MARKETS[0].poolId);
  const [error, setError] = useState("");
  const { deposit, isLoading, isSuccess, hash, lastMaturityDays } = useMintPTYT();

  const parsedAmount = parseDepositAmount(amount, USE_REAL_V4 ? 6 : 18);
  const requiredWeth = parsedAmount > 0n ? parsedAmount : 0n;
  const usdcApproval = useTokenApproval(USDC_ADDRESS, parsedAmount);
  const wethApproval = useTokenApproval(WETH_ADDRESS, requiredWeth);
  const maturityNumber = Number(maturityDays);
  const estimatedYT = parsedAmount > 0n ? (parsedAmount * BigInt(maturityNumber)) / 365n : 0n;
  const selectedMarket = DEMO_MARKETS.find((market) => market.poolId === selectedPool) ?? DEMO_MARKETS[0];
  const premiumBps = BigInt(selectedMarket.premiumBps);
  const premium = parsedAmount > 0n ? (parsedAmount * premiumBps) / 10_000n : 0n;

  useEffect(() => {
    if (isSuccess) onSuccess?.();
  }, [isSuccess, onSuccess]);

  useEffect(() => {
    if (poolId) setSelectedPool(poolId);
    else if (mode === "new-position") setSelectedPool(DEMO_MARKETS[0].poolId);
  }, [mode, poolId]);

  const resetAndClose = useCallback(() => {
    setAmount("");
    setMaturityDays("90");
    setError("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") resetAndClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, resetAndClose]);

  if (!open) return null;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError("Enter a deposit amount greater than zero.");
      return;
    }
    if (USE_REAL_V4 && (!usdcApproval.approved || !wethApproval.approved)) {
      setError("Approve USDC and WETH to SYRouter before adding real V4 liquidity.");
      return;
    }
    setError("");
    deposit(amount, selectedPool, maturityNumber);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) resetAndClose();
      }}
    >
      <section className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg border bg-card shadow-lg sm:max-h-[calc(100dvh-3rem)]" role="dialog" aria-modal="true" aria-labelledby="deposit-title">
        <div className="flex flex-none items-start justify-between gap-4 border-b bg-card p-5 sm:p-6">
          <div>
            <h2 id="deposit-title" className="text-xl font-semibold">
              {mode === "add-liquidity" ? `Add liquidity to ${selectedMarket.pair}` : "Open a new PT/YT position"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "add-liquidity"
                ? "Fund the selected V4 pool and mint its structured principal and yield claims."
                : "Choose a pool and create a structured LP position in one transaction."}
            </p>
            <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${USE_REAL_V4 ? "bg-[#4ade80]/10 text-[#4ade80]" : "bg-[#d4a853]/10 text-[#d4a853]"}`}>
              {USE_REAL_V4 ? "Real V4 mode · Unichain Sepolia" : "Scaffold demo mode"}
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-md border bg-background text-foreground transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Close deposit dialog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {isSuccess ? (
          <div className="mb-6 rounded-lg border bg-secondary p-4">
            <p className="font-medium">PT-LP and YT-LP minted</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your {USE_REAL_V4 ? 90 : lastMaturityDays} day position was submitted. The dashboard will refresh shortly.
            </p>
          </div>
          ) : null}

          <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="pool" className="text-sm font-medium">Pool</label>
            <select
              id="pool"
              value={selectedPool}
              onChange={(event) => setSelectedPool(event.target.value as `0x${string}`)}
              disabled={mode === "add-liquidity"}
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
              <p id="amount-hint" className="text-xs text-muted-foreground">
                {USE_REAL_V4
                  ? "Real V4 liquidity on Unichain Sepolia. Approve WETH/USDC to router first."
                  : "Demo mode: scaffold deposit, no real token transfer."}
              </p>
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
              <PreviewRow label="PT-LP to receive" value={formatCurrency(parsedAmount, USE_REAL_V4 ? 6 : 18)} />
              <PreviewRow label="YT-LP to receive" value={formatCurrency(estimatedYT, USE_REAL_V4 ? 6 : 18)} />
              <PreviewRow label="Estimated fixed APY" value={formatBps(selectedMarket.premiumBps)} />
              <PreviewRow label="Insurance premium" value={formatCurrency(premium, USE_REAL_V4 ? 6 : 18)} />
            </dl>
          </div>

          {USE_REAL_V4 ? (
            <div className="rounded-md border border-[#d4a853]/20 bg-[#d4a853]/5 p-3 text-xs text-[#d4a853]">
              <p>
                Real V4 deposits call `SYRouter.addLiquidityToPool`. Approve router{" "}
                <span className="font-mono">{SY_ROUTER.address.slice(0, 6)}...{SY_ROUTER.address.slice(-4)}</span>{" "}
                before depositing.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <ApprovalButton
                  label={`Approve ${formatCurrency(parsedAmount, 6)} USDC`}
                  approvedLabel="USDC Approved"
                  approved={parsedAmount > 0n && usdcApproval.approved}
                  disabled={parsedAmount === 0n || usdcApproval.isLoading}
                  loading={usdcApproval.isLoading}
                  onClick={usdcApproval.approve}
                />
                <ApprovalButton
                  label={`Approve ${formatUnits(requiredWeth, 18)} WETH`}
                  approvedLabel="WETH Approved"
                  approved={requiredWeth > 0n && wethApproval.approved}
                  disabled={requiredWeth === 0n || wethApproval.isLoading}
                  loading={wethApproval.isLoading}
                  onClick={wethApproval.approve}
                />
              </div>
            </div>
          ) : null}

          {hash ? (
            <p className="rounded-md border bg-secondary/40 p-3 font-mono text-xs text-muted-foreground">
              Pending tx: {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          ) : null}

          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 flex flex-col-reverse gap-3 border-t bg-card p-5 sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end sm:p-6">
            <button
              type="button"
              onClick={resetAndClose}
              className="min-h-10 rounded-md border px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (USE_REAL_V4 && (!usdcApproval.approved || !wethApproval.approved))}
              aria-busy={isLoading}
              className="min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? "Submitting..."
                : mode === "add-liquidity"
                  ? "Add liquidity & mint PT/YT"
                  : "Create new position"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ApprovalButton({
  approved,
  approvedLabel,
  disabled,
  label,
  loading,
  onClick
}: {
  approved: boolean;
  approvedLabel: string;
  disabled: boolean;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={approved || disabled}
      onClick={onClick}
      className="min-h-10 rounded-lg border border-[#d4a853]/25 px-3 font-semibold text-[#d4a853] transition hover:bg-[#d4a853]/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {approved ? approvedLabel : loading ? "Approving..." : label}
    </button>
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
