"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { MaturityTimeline } from "@/components/MaturityTimeline";
import { PTYTSplitVisual } from "@/components/PTYTSplitVisual";
import { useRedeemPT } from "@/hooks/useRedeemPT";
import { usePosition } from "@/hooks/usePositions";
import { formatBps, formatCurrency, formatDuration } from "@/lib/math";

export default function PositionDetailPage() {
  const { data: position } = usePosition();
  const { redeem, isLoading, isSuccess, error } = useRedeemPT();

  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>
          <ConnectWallet />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">ETH / USDC</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Position detail</h1>
          </div>
          <button
            type="button"
            onClick={() => redeem()}
            disabled={isLoading}
            aria-busy={isLoading}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Redeeming..." : "Redeem at maturity"}
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-card p-4 text-sm text-destructive">
            Redemption failed. Confirm maturity and wallet network, then try again.
          </div>
        ) : null}

        {isSuccess ? (
          <div className="mt-6 rounded-lg border bg-secondary p-4 text-sm">
            Redemption submitted successfully.
          </div>
        ) : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">PT/YT split</h2>
            <div className="mt-6">
              <PTYTSplitVisual pt={position.ptBalance} yt={position.ytBalance} />
            </div>
            <div className="mt-8">
              <MaturityTimeline />
            </div>
          </div>

          <aside className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Risk summary</h2>
            <dl className="mt-6 space-y-4">
              <Row label="Principal" value={formatCurrency(position.ptBalance)} />
              <Row label="YT fees" value={formatCurrency(position.accruedFees)} />
              <Row label="Current IL" value={formatBps(position.currentILBps)} />
              <Row label="IL amount" value={formatCurrency(position.currentILAmount)} />
              <Row label="Maturity" value={formatDuration(position.secondsToMaturity)} />
            </dl>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm font-semibold">{value}</dd>
    </div>
  );
}

